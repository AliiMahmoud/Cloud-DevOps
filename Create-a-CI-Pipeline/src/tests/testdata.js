const { generateData } = require('../data')

test('generating right', () => {
    expect(generateData()).toBe("this is data");
})
