import { View } from "@dlightjs/dlight"
import { headerWrap, navBtn, headerLogo } from "./style.module.css"
import { type Typed, div, img, a, type Pretty } from "@dlightjs/types"

interface NavProps {
  url: string
  navName: string
}

@View
class Header {
  navList = [
    {
      url: "https://dlight-js.com/docs",
      navName: "Docs"
    },
    {
      url: "https://dlight-js.com/examples",
      navName: "Examples"
    },
    {
      url: "https://dlight-js.com/playground",
      navName: "Playground"
    }
  ]

  @View
  Nav = (({ url, navName }: NavProps) => {
    a(navName)
      .className(navBtn)
      .href(url)
  }) as any as Typed<NavProps>

  Body() {
    div()
      .className(headerWrap)
    {
      img()
        .src("./logo_title.png")
        .className(headerLogo)
      div()
      {
        for (const navItem of this.navList) {
          this.Nav()
            .url(navItem.url)
            .navName(navItem.navName)
        }
      }
    }
  }
}

export default Header as Pretty as Typed
