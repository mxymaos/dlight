
export function getHashLocation() {
    return location.hash.slice(2)
}

export function getHistoryLocation() {
    return location.pathname.slice(1)
}

export function getPath(url: string, baseUrl: string) {
    let newHref
    if (url[0] === "/") {
        newHref = url
    } else {
        // ---- 相对位置
        if (url[0] !== ".") url = "./" + url
        const splitUrls = url.split("/")
        const currUrls = baseUrl.split("/").filter(u=>u)
        let idx = 0
        for (let splitUrl of splitUrls) {
            if (![".", ".."].includes(splitUrl)) break
            if (splitUrl === "..") {
                if (currUrls.length === 0) {
                    // TODO 报错 没有前路径给你 ../ 了
                    console.warn(`no ../ in ${url}`)
                }
                currUrls.pop()
            }
            idx ++
        }
        newHref = "/" + [...currUrls, ...splitUrls.slice(idx)].join("/")
    }
    return newHref
}

