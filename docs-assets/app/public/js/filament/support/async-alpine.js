var u = (t) =>
        new Promise((e) => {
            window.addEventListener('async-alpine:load', (s) => {
                s.detail.id === t.id && e()
            })
        }),
    a = u,
    _ = () =>
        new Promise((t) => {
            'requestIdleCallback' in window
                ? window.requestIdleCallback(t)
                : setTimeout(t, 200)
        }),
    l = _,
    c = (t) =>
        new Promise((e) => {
            let s = t.indexOf('('),
                i = t.slice(s),
                n = window.matchMedia(i)
            n.matches ? e() : n.addEventListener('change', e, { once: !0 })
        }),
    d = c,
    f = (t, e) =>
        new Promise((s) => {
            let i = '0px 0px 0px 0px'
            if (e.indexOf('(') !== -1) {
                let o = e.indexOf('(') + 1
                i = e.slice(o, -1)
            }
            let n = new IntersectionObserver(
                (o) => {
                    o[0].isIntersecting && (n.disconnect(), s())
                },
                { rootMargin: i },
            )
            n.observe(t.el)
        }),
    p = f,
    h = '__internal_',
    r = {
        Alpine: null,
        _options: {
            prefix: 'ax-',
            alpinePrefix: 'x-',
            root: 'load',
            inline: 'load-src',
            defaultStrategy: 'immediate',
        },
        _alias: !1,
        _data: {},
        _realIndex: 0,
        get _index() {
            return this._realIndex++
        },
        init(t, e = {}) {
            return (
                (this.Alpine = t),
                (this._options = { ...this._options, ...e }),
                this
            )
        },
        start() {
            return (
                this._processInline(),
                this._setupComponents(),
                this._mutations(),
                this
            )
        },
        data(t, e = !1) {
            return (this._data[t] = { loaded: !1, download: e }), this
        },
        url(t, e) {
            !t ||
                !e ||
                (this._data[t] || this.data(t),
                (this._data[t].download = () => import(this._parseUrl(e))))
        },
        alias(t) {
            this._alias = t
        },
        _processInline() {
            let t = document.querySelectorAll(
                `[${this._options.prefix}${this._options.inline}]`,
            )
            for (let e of t) this._inlineElement(e)
        },
        _inlineElement(t) {
            let e = t.getAttribute(`${this._options.alpinePrefix}data`),
                s = t.getAttribute(
                    `${this._options.prefix}${this._options.inline}`,
                )
            if (!e || !s) return
            let i = this._parseName(e)
            this.url(i, s)
        },
        _setupComponents() {
            let t = document.querySelectorAll(
                `[${this._options.prefix}${this._options.root}]`,
            )
            for (let e of t) this._setupComponent(e)
        },
        _setupComponent(t) {
            let e = t.getAttribute(`${this._options.alpinePrefix}data`)
            t.setAttribute(`${this._options.alpinePrefix}ignore`, '')
            let s = this._parseName(e),
                i =
                    t.getAttribute(
                        `${this._options.prefix}${this._options.root}`,
                    ) || this._options.defaultStrategy
            this._componentStrategy({
                name: s,
                strategy: i,
                el: t,
                id: t.id || this._index,
            })
        },
        async _componentStrategy(t) {
            let e = t.strategy
                .split('|')
                .map((i) => i.trim())
                .filter((i) => i !== 'immediate')
                .filter((i) => i !== 'eager')
            if (!e.length) {
                await this._download(t.name), this._activate(t)
                return
            }
            let s = []
            for (let i of e) {
                if (i === 'idle') {
                    s.push(l())
                    continue
                }
                if (i.startsWith('visible')) {
                    s.push(p(t, i))
                    continue
                }
                if (i.startsWith('media')) {
                    s.push(d(i))
                    continue
                }
                i === 'event' && s.push(a(t))
            }
            Promise.all(s).then(async () => {
                await this._download(t.name), this._activate(t)
            })
        },
        async _download(t) {
            if (
                t.startsWith(h) ||
                (this._handleAlias(t), !this._data[t] || this._data[t].loaded)
            )
                return
            let e = await this._getModule(t)
            this.Alpine.data(t, e), (this._data[t].loaded = !0)
        },
        async _getModule(t) {
            if (!this._data[t]) return
            let e = await this._data[t].download()
            return typeof e == 'function'
                ? e
                : e[t] || e.default || Object.values(e)[0] || !1
        },
        _activate(t) {
            t.el.removeAttribute(`${this._options.alpinePrefix}ignore`),
                (t.el._x_ignore = !1),
                this.Alpine.initTree(t.el)
        },
        _mutations() {
            new MutationObserver((e) => {
                for (let s of e)
                    if (s.addedNodes)
                        for (let i of s.addedNodes)
                            i.nodeType === 1 &&
                                (i.hasAttribute(
                                    `${this._options.prefix}${this._options.root}`,
                                ) && this._mutationEl(i),
                                i
                                    .querySelectorAll(
                                        `[${this._options.prefix}${this._options.root}]`,
                                    )
                                    .forEach((o) => this._mutationEl(o)))
            }).observe(document, { attributes: !0, childList: !0, subtree: !0 })
        },
        _mutationEl(t) {
            t.hasAttribute(`${this._options.prefix}${this._options.inline}`) &&
                this._inlineElement(t),
                this._setupComponent(t)
        },
        _handleAlias(t) {
            !this._alias ||
                this._data[t] ||
                this.url(t, this._alias.replace('[name]', t))
        },
        _parseName(t) {
            return (t || '').split(/[({]/g)[0] || `${h}${this._index}`
        },
        _parseUrl(t) {
            return new RegExp('^(?:[a-z+]+:)?//', 'i').test(t)
                ? t
                : new URL(t, document.baseURI).href
        },
    }
document.addEventListener('alpine:init', () => {
    ;(window.AsyncAlpine = r),
        r.init(Alpine, window.AsyncAlpineOptions || {}),
        document.dispatchEvent(new CustomEvent('async-alpine:init')),
        r.start()
})
