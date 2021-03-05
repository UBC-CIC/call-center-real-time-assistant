export const PROCEDURES = [
    {
        key: 'BNE',
        text: 'Break and Enter'
    },
    {
        key: 'BNEI',
        text: 'Break and Enter in progress'
    },
    {
        key: 'INSEC',
        text: 'Insecure Premise'
    },
    {
        key: 'MISCH',
        text: 'Mischief'
    },
    {
        key: 'MISCHI',
        text: 'Mischief in progress'
    },
    {
        key: 'PROP',
        text: 'Property Lost/Found'
    },
    {
        key: 'THEFT',
        text: 'Theft'
    },
    {
        key: 'THEFTI',
        text: 'Theft in progress'
    },
]

export const JURISDICTIONS = [
    {key: 'VPD',value: 'Vancouver'},
    {key: 'APD', value: 'Abbotsford'},
    {key: 'DPD', value: 'Delta'},
]

export const DYNAMODB_PING_INTERVAL = 1000

export const MAX_CHANGELESS_PINGS = 20

export const END_OF_CALL_STRING = "------------------------------------------------ END OF CALL --------------------------------------------------"