<template>
  <div class="flowchart-node" :style="nodeStyle" 
    v-touch:start="handleMousedown"
    v-touch:longtap="handleMouseDouble"
    @dblclick="handleMouseDouble"
    @mousedown="handleMousedown"
    @mouseover="handleMouseOver"
    @mouseleave="handleMouseLeave"
    v-bind:class="{selected: options.selected === id}"
  >
    <div class="node-port node-input"
      @mouseup="inputMouseUp"
      @mousedown="inputMouseDown"
    ></div>
    <div :id="'node-main_' + id" class="node-main">
      <div v-if="isError" :id="'node-main_' + id" class="node-error">
        <span>Error</span>
      </div>
      <div v-else-if="isWarning" :id="'node-main_' + id" class="node-warning">
        <span>Warning</span>
      </div>
      <div v-else-if="isSuccess" :id="'node-main_' + id" class="node-success">
        <span>Success</span>
      </div>
      <div ref="nodeType" :id="'node-type_' + id" v-text="type" class="node-type"></div>
      <div class="node-label" :id="'label_' + id">
        <div ref="labelTitle" class="node-label-title" :id="'label-title_' + id" v-text="label" />
        <div v-if="buttons.length > 0" class="node-buttons" :id="'node-buttons_' + id">
          <div v-for="(button, index) in buttons" :key="index" :id="'button_' + id + '_' + index" class="node-label-button">
            <span>{{button.text}}</span>
            <div class="node-port node-output" :id="'port_' + id + '_' + index" 
              :style="buttonPortStyle(index)"
              @mousedown="outputMouseDown(index, $event)"
            ></div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="buttons.length === 0" :id="'node-output_' + id" class="node-port node-output"
      @mousedown="outputMouseDown(-1, $event)"
    >
    </div>
    <div v-show="show.delete" class="node-delete">&times;</div>
  </div>
</template>

<script>
export default {
  name: 'FlowchartNode',
  props: {
    id: {
      type: Number,
      default: 1000,
      validator(val) {
        return typeof val === 'number'
      }
    },
    x: {
      type: Number,
      default: 0,
      validator(val) {
        return typeof val === 'number'
      }
    },    
    y: {
      type: Number,
      default: 0,
      validator(val) {
        return typeof val === 'number'
      }
    },
    centeredX: {
      type: Number,
      default: 0,
      validator(val) {
        return typeof val === 'number'
      }
    },    
    centeredY: {
      type: Number,
      default: 0,
      validator(val) {
        return typeof val === 'number'
      }
    },
    type: {
      type: String,
      default: 'Default'
    },
    label: {
      type: String,
      default: 'input name'
    },
    options: {
      type: Object,
      default() {
        return {
          centerX: 1024,
          scale: 1,
          centerY: 140,
        }
      }
    },
    isError: {
      type: Boolean,
      default() {
        return false;
      }
    },
    isWarning: {
      type: Boolean,
      default() {
        return false;
      }
    },
    isSuccess: {
      type: Boolean,
      default() {
        return false;
      }
    },
    buttons: {
      type: Array,
      default() {
        return [];
      }
    }
  },
  data() {
    return {
      show: {
        delete: false,
      },
      linkingStart: false
    }
  },
  mounted() {
  },
  computed: {
    nodeStyle() {
      return {
        top: ((this.centeredY || this.y)  * this.options.scale) + 'px', // remove: this.options.offsetTop + 
        left: ((this.centeredX || this.x) * this.options.scale) + 'px', // remove: this.options.offsetLeft + 
        transform: `scale(${this.options.scale})`,
      }
    }
  },
  methods: {
    buttonPortStyle(index) {
      const nodeTypeElement = this.$refs.nodeType;
      if (!nodeTypeElement) { return; }

      const labelTitleElement = this.$refs.labelTitle;
      if (!labelTitleElement) { return; }

      const nodeTypeHeight = nodeTypeElement.offsetHeight;
      const labelTitleHeight = labelTitleElement.offsetHeight;

      let buttonHeight = labelTitleHeight + nodeTypeHeight;

      let element = null;
      for (let i = index; i >= 0; i--) {
        element = document.getElementById('button_' + this.id + '_' + i);
        if(!element) { continue; }
        if(i === index) {
          buttonHeight += element.offsetHeight/1.75;
        } else {
          buttonHeight += element.offsetHeight;
        }
      }
      
      return {
        top: buttonHeight + 'px',
        right: '-8px',
        marginTop: '0px'
      }
    },
    handleMousedown(e) {
      const target = e.target || e.srcElement;
      if (target.className.indexOf('node-input') < 0 && target.className.indexOf('node-output') < 0) {
        this.$emit('nodeSelected', e);
      }
      if (e.type.includes('mouse')) {
        e.preventDefault();
      }
    },
    handleMouseOver() {
      this.show.delete = true;
    },
    handleMouseLeave() {
      this.show.delete = false;
    },
    handleMouseDouble() {
      return null
    },
    outputMouseDown(buttonIndex, e) {
      e.buttonIndex = buttonIndex;
      this.$emit('linkingStart', e)
      if (e.type.includes('mouse')) {
        e.preventDefault();
      }
    },
    // eslint-disable-next-line
    outputMouseMove(e) {
      if (this.linkingStart) {
        this.$emit('linkingStart')
      }
    },
    outputMouseMoveFromButtonNode(buttonIndex, e) {
      if (this.linkingStart) {
        this.$emit('linkingStart', buttonIndex, e)
      }
    },
    outputMouseUp(e) {
      this.linkingStart = false;
      if (e.type.includes('mouse')) {
        e.preventDefault();
      }
    },
    inputMouseDown(e) {
      if (e.type.includes('mouse')) {
        e.preventDefault();
      }
    },
    inputMouseUp(e) {
      this.$emit('linkingStop')
      if (e.type.includes('mouse')) {
        e.preventDefault();
      }
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
$themeColor: rgb(120, 120, 120);
$portSize: 16;

.flowchart-node {
  margin: 0;
  width: 200px;
  position: absolute;
  box-sizing: border-box;
  border: none;
  opacity: .9;
  cursor: move;
  transform-origin: top left;
  z-index: 1;
  .node-main {
    text-align: center;
    .node-error {
      margin: 0 auto;
      background: #ff0000;
      opacity: 0.7;
      padding: 6px;
      width: 200px;
      border-radius: 4px;
      position: relative;
      span {
        color: #FFF;
        font-size: 14px;
        font-weight: 600;
      }
    }
    .node-warning {
      margin: 0 auto;
      background: #ffcc00;
      opacity: 0.7;
      padding: 6px;
      width: 200px;
      border-radius: 4px;
      position: relative;
      span {
        color: #FFF;
        font-size: 14px;
        font-weight: 600;
      }
    }
    .node-success {
      margin: 0 auto;
      background: #00ff00;
      opacity: 0.7;
      padding: 6px;
      width: 200px;
      border-radius: 4px;
      position: relative;
      span {
        color: #FFF;
        font-size: 14px;
        font-weight: 600;
      }
    }
    .node-type {
      background: #ccccb3;
      opacity: 0.7;
      border: 2px solid #ffffff;
      border-radius: 6px;
      border-bottom-left-radius: 0px;
      border-bottom-right-radius: 0px;
      color: black;
      font-size: 16px;
      font-weight: 600;
      padding: 6px;
    }
    .node-label {
      font-size: 14px;
      background: #FFF;
      border: 2px solid #e0e6ed;

      .node-label-title{
        border-radius: 4px;
        background: #FFF;
        padding: 16px;
      }
      .node-label-button {
        border: 1px solid #dfdfdf;
        border-radius: 4px;
        background: #EFEFEF;
        color: #0084ff;
        padding: 10px;
        font-weight: 600;
      }
    }
  }
  .node-port {
    position: absolute;
    width: #{$portSize}px;
    height: #{$portSize}px;
    top: 50%;
    transform: translateY(-50%);
    border: 1px solid #ccc;
    border-radius: 100px;
    background: #8492a6;
    opacity: 0.8;
    &:hover {
      background: $themeColor;
      border: 1px solid $themeColor;
    }
    &.node-port-start {
      margin-top: 17px;
      top: 50%;
      transform: translateY(-50%);
    }
  }
  .node-input {
    left: #{-2+$portSize/-3}px;
  }
  .node-output {
    right: #{-2+$portSize/-3}px;
  }
  .node-delete {
    position: absolute;
    right: -10px;
    top: -10px;
    font-size: 15px;
    width: 20px;
    height: 20px;
    color: $themeColor;
    cursor: pointer;
    background: white;
    border: 1px solid $themeColor;
    border-radius: 100px;
    text-align: center;
    &:hover{
      background: $themeColor;
      color: white;
    }
  }
}
.selected {
  box-shadow: 0 0 0 2px $themeColor;
}
</style>
