import '@testing-library/jest-dom'

describe('<ProfileSelector /> when the props have NOT been initialized', () => {

    test('it should NOT display the ProfileSelector', () => { })
})

describe('<ProfileSelector /> when the props have been initialized', () => {

    test('it should display the ProfileSelector', () => { })
})

describe('<ProfileSelector /> when the props have been initialized and there NOT is a profile', () => {

    test('it should display the login', () => { })

    test('it should display the signup', () => { })

    test('it should NOT display the Avatar', () => { })
})

describe('<ProfileSelector /> when the props have been initialized and there is a profile', () => {

    test('it should NOT display the login', () => { })

    test('it should NOT display the signup', () => { })

    test('it should display the Avatar', () => { })
})
