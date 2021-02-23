export const calls = [
    {key: 'Test1', value: 'as24s3qag379'},
    {key: 'Test2', value: 'h4s3ts77fy7l'},
    {key: 'Test3', value: 'sj460dg9n23a'},
    {key: 'Test4', value: 'ncd040s72n5p'},
    {key: 'Test5', value: 'gh77sb92ve45'}
    ]

export const fakeValues = {
    as24s3qag379: [
        ["Hi there",
            "Hi",
            "",
            ""],
        ["Hi there, I would like to",
            "Hi, would like",
            "",
            ""],
        ["Hi there, I would like to report a bike theft",
            "Hi, would like, report, bike theft",
            "THEFT",
            ""],
        ["Hi there, I would like to report a bike theft on the UBC Vancouver campus.",
            "Hi, would like, report, bike theft, UBC, Vancouver campus",
            "THEFT",
            "VPD"]
    ],
    h4s3ts77fy7l:  [
        ["Is this",
            "",
            "",
            ""],
        ["Is this the police?",
            "the police",
            "",
            ""],
        ["Is this the police? My car's been broken",
            "the police, broken",
            "BNE",
            ""],
        ["Is this the police? My car's been broken into and my belongings are missing!",
            "the police, broken, missing",
            "BNE",
            ""]
    ]
}

export var tickNumber = 0

export function resetTickNumber() {
    tickNumber = 0
}

export function updateTick() {
    if (tickNumber < 3) {
        tickNumber++;
    }
}
