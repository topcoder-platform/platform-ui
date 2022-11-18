/* eslint-disable func-names */
/* eslint-disable no-param-reassign */
/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/typedef */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

function UniNavSnippet(url) {

    !(function (n, t, e, a, c, i, o) {

        n.TcUnivNavConfig = c

        n[c] = n[c] || function () {
            (n[c].q = n[c].q ?? []).push(arguments)
        }

        n[c].l = 1 * new Date()

        i = t.createElement(e)

        o = t.getElementsByTagName(e)[0]

        i.async = 1

        i.type = 'module'

        i.src = a
        
        o.parentNode.insertBefore(i, o)

    }(window, document, 'script', url, 'tcUniNav'))
}

export default UniNavSnippet
