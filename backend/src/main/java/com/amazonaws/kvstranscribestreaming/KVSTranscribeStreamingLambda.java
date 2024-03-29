package com.amazonaws.kvstranscribestreaming;

import com.amazonaws.auth.AWSCredentialsProvider;
import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import com.amazonaws.kinesisvideo.parser.ebml.InputStreamParserByteSource;
import com.amazonaws.kinesisvideo.parser.mkv.StreamingMkvReader;
import com.amazonaws.kinesisvideo.parser.utilities.FragmentMetadataVisitor;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.cloudwatch.AmazonCloudWatchClientBuilder;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.document.DynamoDB;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.transcribestreaming.FileByteToAudioEventSubscription;
import com.amazonaws.transcribestreaming.KVSByteToAudioEventSubscription;
import com.amazonaws.transcribestreaming.StreamTranscriptionBehaviorImpl;
import com.amazonaws.transcribestreaming.TranscribeStreamingRetryClient;
import org.reactivestreams.Publisher;
import org.reactivestreams.Subscriber;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.services.transcribestreaming.model.AudioStream;
import software.amazon.awssdk.services.transcribestreaming.model.LanguageCode;
import software.amazon.awssdk.services.transcribestreaming.model.MediaEncoding;
import software.amazon.awssdk.services.transcribestreaming.model.StartStreamTranscriptionRequest;

import java.io.*;
import java.nio.ByteBuffer;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Optional;
import java.util.Date;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Main Java Lambda using AWS Kinesis Video Streams and AWS Transcribe to asynchronously transcribe .
 * The data flow is :
 * Amazon Connect => AWS KVS => AWS Transcribe => AWS DynamoDB
 *
 * Code modified from https://github.com/amazon-connect/amazon-connect-realtime-transcription
 *
 */

public class KVSTranscribeStreamingLambda implements RequestHandler<TranscriptionRequest, String> {

    private static final Regions REGION = Regions.fromName(System.getenv("APP_REGION"));
    private static final Regions TRANSCRIBE_REGION = Regions.fromName(System.getenv("TRANSCRIBE_REGION"));
    private static final String TRANSCRIBE_ENDPOINT = "https://transcribestreaming." + TRANSCRIBE_REGION.getName() + ".amazonaws.com";
    private static final boolean CONSOLE_LOG_TRANSCRIPT_FLAG = Boolean.parseBoolean(System.getenv("CONSOLE_LOG_TRANSCRIPT_FLAG"));
    private static final String START_SELECTOR_TYPE = System.getenv("START_SELECTOR_TYPE");
    private static final String TABLE_CALLER_TRANSCRIPT = System.getenv("TABLE_CALLER_TRANSCRIPT");
    private static final String TABLE_CALLER_TRANSCRIPT_TO_CUSTOMER = System.getenv("TABLE_CALLER_TRANSCRIPT_TO_CUSTOMER");

    private static final Logger logger = LoggerFactory.getLogger(KVSTranscribeStreamingLambda.class);
    public static final MetricsUtil metricsUtil = new MetricsUtil(AmazonCloudWatchClientBuilder.defaultClient());
    private static final DateFormat DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ");


    // SegmentWriter saves Transcription segments to DynamoDB
    private TranscribedSegmentWriter fromCustomerSegmentWriter = null;
    private TranscribedSegmentWriter toCustomerSegmentWriter = null;

    /**
     * Handler function for the Lambda
     *
     * @param request
     * @param context
     * @return
     */
    @Override
    public String handleRequest(TranscriptionRequest request, Context context) {

        logger.info("received request : " + request.toString());
        logger.info("received context: " + context.toString());

        try {
            // validate the request
            request.validate();

            // create a SegmentWriter to be able to save off transcription results
            AmazonDynamoDBClientBuilder builder = AmazonDynamoDBClientBuilder.standard();
            builder.setRegion(REGION.getName());
            fromCustomerSegmentWriter = new TranscribedSegmentWriter(request.getConnectContactId(), new DynamoDB(builder.build()),
                    CONSOLE_LOG_TRANSCRIPT_FLAG);
            toCustomerSegmentWriter = new TranscribedSegmentWriter(request.getConnectContactId(), new DynamoDB(builder.build()),
                    CONSOLE_LOG_TRANSCRIPT_FLAG);
            
            // Else start streaming between KVS and Transcribe
            startKVSToTranscribeStreaming(request.getStreamARN(), request.getStartFragmentNum(), request.getConnectContactId(),
                    request.isTranscriptionEnabled(), request.getLanguageCode(), request.getSaveCallRecording(),
                    request.isStreamAudioFromCustomer(), request.isStreamAudioToCustomer());

            return "{ \"result\": \"Success\" }";

        } catch (Exception e) {
            logger.error("KVS to Transcribe Streaming failed with: ", e);
            return "{ \"result\": \"Failed\" }";
        }
    }

    /**
     * Starts streaming between KVS and Transcribe
     * The transcript segments are continuously saved to the Dynamo DB table
     *
     * @param streamARN
     * @param startFragmentNum
     * @param contactId
     * @param languageCode
     * @throws Exception
     */
    private void startKVSToTranscribeStreaming(String streamARN, String startFragmentNum, String contactId, boolean transcribeEnabled,
                                               Optional<String> languageCode, Optional<Boolean> saveCallRecording,
                                               boolean isStreamAudioFromCustomerEnabled, boolean isStreamAudioToCustomerEnabled) throws Exception {
        String streamName = streamARN.substring(streamARN.indexOf("/") + 1, streamARN.lastIndexOf("/"));

        KVSStreamTrackObject kvsStreamTrackObjectFromCustomer = null;
        KVSStreamTrackObject kvsStreamTrackObjectToCustomer = null;

        if (isStreamAudioFromCustomerEnabled) {
            kvsStreamTrackObjectFromCustomer = getKVSStreamTrackObject(streamName, startFragmentNum, KVSUtils.TrackName.AUDIO_FROM_CUSTOMER.getName(), contactId);
        }
        if (isStreamAudioToCustomerEnabled) {
            kvsStreamTrackObjectToCustomer = getKVSStreamTrackObject(streamName, startFragmentNum, KVSUtils.TrackName.AUDIO_TO_CUSTOMER.getName(), contactId);
        }

        if (transcribeEnabled) {
            try (TranscribeStreamingRetryClient client = new TranscribeStreamingRetryClient(getTranscribeCredentials(),
                    TRANSCRIBE_ENDPOINT, TRANSCRIBE_REGION, metricsUtil)) {

                logger.info("Calling Transcribe service..");
                CompletableFuture<Void> fromCustomerResult = null;
                CompletableFuture<Void> toCustomerResult = null;

                if (kvsStreamTrackObjectFromCustomer != null) {
                    fromCustomerResult = getStartStreamingTranscriptionFuture(kvsStreamTrackObjectFromCustomer,
                            languageCode, contactId, client, fromCustomerSegmentWriter, TABLE_CALLER_TRANSCRIPT, KVSUtils.TrackName.AUDIO_FROM_CUSTOMER.getName());
                }

                if (kvsStreamTrackObjectToCustomer != null) {
                    toCustomerResult = getStartStreamingTranscriptionFuture(kvsStreamTrackObjectToCustomer,
                            languageCode, contactId, client, toCustomerSegmentWriter, TABLE_CALLER_TRANSCRIPT_TO_CUSTOMER, KVSUtils.TrackName.AUDIO_TO_CUSTOMER.getName());
                }

                // Synchronous wait for stream to close, and close client connection
                // Timeout of 890 seconds because the Lambda function can be run for at most 15 mins (~890 secs)
                if (null != fromCustomerResult) {
                    fromCustomerResult.get(890, TimeUnit.SECONDS);
                }

                if (null != toCustomerResult) {
                    toCustomerResult.get(890, TimeUnit.SECONDS);
                }

            } catch (TimeoutException e) {
                logger.debug("Timing out KVS to Transcribe Streaming after 890 sec");

            } catch (Exception e) {
                logger.error("Error during streaming: ", e);
                throw e;

            }
        }
    }

    /**
     * Create all objects necessary for KVS streaming from each track
     *
     * @param streamName
     * @param startFragmentNum
     * @param trackName
     * @param contactId
     * @return
     * @throws FileNotFoundException
     */
    private KVSStreamTrackObject getKVSStreamTrackObject(String streamName, String startFragmentNum, String trackName,
                                                         String contactId) throws FileNotFoundException {
        InputStream kvsInputStream = KVSUtils.getInputStreamFromKVS(streamName, REGION, startFragmentNum, getAWSCredentials(), START_SELECTOR_TYPE);
        StreamingMkvReader streamingMkvReader = StreamingMkvReader.createDefault(new InputStreamParserByteSource(kvsInputStream));

        KVSContactTagProcessor tagProcessor = new KVSContactTagProcessor(contactId);
        FragmentMetadataVisitor fragmentVisitor = FragmentMetadataVisitor.create(Optional.of(tagProcessor));

        String fileName = String.format("%s_%s_%s.raw", contactId, DATE_FORMAT.format(new Date()), trackName);
        Path saveAudioFilePath = Paths.get("/tmp", fileName);
        FileOutputStream fileOutputStream = new FileOutputStream(saveAudioFilePath.toString());

        return new KVSStreamTrackObject(kvsInputStream, streamingMkvReader, tagProcessor, fragmentVisitor, saveAudioFilePath, fileOutputStream, trackName);
    }


    private CompletableFuture<Void> getStartStreamingTranscriptionFuture(KVSStreamTrackObject kvsStreamTrackObject, Optional<String> languageCode,
                                                                         String contactId, TranscribeStreamingRetryClient client,
                                                                         TranscribedSegmentWriter transcribedSegmentWriter,
                                                                         String tableName, String channel) {
        return client.startStreamTranscription(
                // since we're definitely working with telephony audio, we know that's 8 kHz
                getRequest(8000, languageCode),
                new KVSAudioStreamPublisher(
                        kvsStreamTrackObject.getStreamingMkvReader(),
                        contactId,
                        kvsStreamTrackObject.getOutputStream(),
                        kvsStreamTrackObject.getTagProcessor(),
                        kvsStreamTrackObject.getFragmentVisitor(),
                        kvsStreamTrackObject.getTrackName()),
                new StreamTranscriptionBehaviorImpl(transcribedSegmentWriter, tableName),
                channel
        );
    }

    /**
     * Write the kvs stream to the output buffer
     *
     * @param kvsStreamTrackObject
     * @param contactId
     * @throws Exception
     */
    private void writeAudioBytesToKvsStream(KVSStreamTrackObject kvsStreamTrackObject, String contactId) throws Exception {

        ByteBuffer audioBuffer = KVSUtils.getByteBufferFromStream(kvsStreamTrackObject.getStreamingMkvReader(),
                kvsStreamTrackObject.getFragmentVisitor(), kvsStreamTrackObject.getTagProcessor(), contactId, kvsStreamTrackObject.getTrackName());

        while (audioBuffer.remaining() > 0) {
            byte[] audioBytes = new byte[audioBuffer.remaining()];
            audioBuffer.get(audioBytes);
            kvsStreamTrackObject.getOutputStream().write(audioBytes);
            audioBuffer = KVSUtils.getByteBufferFromStream(kvsStreamTrackObject.getStreamingMkvReader(),
                    kvsStreamTrackObject.getFragmentVisitor(), kvsStreamTrackObject.getTagProcessor(), contactId, kvsStreamTrackObject.getTrackName());
        }
    }

    /**
     * @return AWS credentials to be used to connect to s3 and KVS
     */
    private static AWSCredentialsProvider getAWSCredentials() {
        return DefaultAWSCredentialsProviderChain.getInstance();
    }

    /**
     * @return AWS credentials to be used to connect to Transcribe service. This example uses the default credentials
     * provider, which looks for environment variables (AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY) or a credentials
     * file on the system running this program.
     */
    private static AwsCredentialsProvider getTranscribeCredentials() {
        return DefaultCredentialsProvider.create();
    }

    /**
     * Build StartStreamTranscriptionRequestObject containing required parameters to open a streaming transcription
     * request, such as audio sample rate and language spoken in audio
     *
     * @param mediaSampleRateHertz sample rate of the audio to be streamed to the service in Hertz
     * @param languageCode the language code to be used for Transcription (optional; see https://docs.aws.amazon.com/transcribe/latest/dg/API_streaming_StartStreamTranscription.html#API_streaming_StartStreamTranscription_RequestParameters )
     * @return StartStreamTranscriptionRequest to be used to open a stream to transcription service
     */
    private static StartStreamTranscriptionRequest getRequest(Integer mediaSampleRateHertz, Optional <String> languageCode) {

        return StartStreamTranscriptionRequest.builder()
                .languageCode(languageCode.isPresent() ? languageCode.get() : LanguageCode.EN_US.toString())
                .mediaEncoding(MediaEncoding.PCM)
                .mediaSampleRateHertz(mediaSampleRateHertz)
                .build();
    }

    /**
     * KVSAudioStreamPublisher implements audio stream publisher.
     * It emits audio events from a KVS stream asynchronously in a separate thread
     */
    private static class KVSAudioStreamPublisher implements Publisher<AudioStream> {
        private final StreamingMkvReader streamingMkvReader;
        private String contactId;
        private OutputStream outputStream;
        private KVSContactTagProcessor tagProcessor;
        private FragmentMetadataVisitor fragmentVisitor;
        private String track;

        private KVSAudioStreamPublisher(StreamingMkvReader streamingMkvReader, String contactId, OutputStream outputStream,
                                        KVSContactTagProcessor tagProcessor, FragmentMetadataVisitor fragmentVisitor,
                                        String track) {
            this.streamingMkvReader = streamingMkvReader;
            this.contactId = contactId;
            this.outputStream = outputStream;
            this.tagProcessor = tagProcessor;
            this.fragmentVisitor = fragmentVisitor;
            this.track = track;
        }

        @Override
        public void subscribe(Subscriber<? super AudioStream> s) {
            s.onSubscribe(new KVSByteToAudioEventSubscription(s, streamingMkvReader, contactId, outputStream, tagProcessor, fragmentVisitor, track));
        }
    }
}
