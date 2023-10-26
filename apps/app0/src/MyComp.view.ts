import {View, Prop} from "@dlightjs/dlight"
import {h1, div, button, s} from "@dlightjs/types"

@View
export class MyComp {
  count = 0  

  Body() {
    h1("hello, dlight js")
    div(this.count)
    button("+")
      .onclick(() => {
        this.count ++
      })
    button("-")
      .onclick(() => {
        this.count --
      })
  }
}