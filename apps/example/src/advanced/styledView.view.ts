// eslint-disable-next-line @typescript-eslint/no-unused-vars
import DLight, { View } from "@dlightjs/dlight"
import { button, div } from "@dlightjs/types"
import { css, styled } from "@dlightjs/emotion"
import { HStack } from "@dlightjs/components"

class StyledView extends View {
  color = "black"
  Body() {
    HStack()
    {
      div()
        .className(css`
        padding: 20px;
        border: 1px solid black;
        width: 100px;
      `)
      {
        button("red")
          .onclick(() => {
            this.color = "red"
          })
        button("blue")
          .onclick(() => {
            this.color = "blue"
          })
        StyledDiv("colorful background")
          .color(this.color)
      }
    }
  }
}

const StyledDiv = styled.div`
background-color: ${(props: any) => props.color};
color: white;
font-size: 12px;
margint-top: 20px;
`

export default StyledView
