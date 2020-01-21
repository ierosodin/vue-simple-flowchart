<template>
  <div>
    <div id="flowchart" class="flowchart">
      <div class="flowchart-container"
        v-touch:moving="handleMove" 
        v-touch:end="handleUp"
        v-touch:start="handleDown"
      >
        <flowchart-node
          v-bind.sync="node"
          :startNodeTitle.sync="scene.startNodeTitle"  
          v-for="(node, index) in scene.nodes"
          :key="`node${index}`"
          :options="nodeOptions"
          @linkingStart="linkingStart(node.id, $event)"
          @linkingStop="linkingStop(node.id)"
          @nodeSelected="nodeSelected(node.id, $event)">
        </flowchart-node>
        <svg width="100%" :height="`${height}px`">
          <flowchart-link v-bind.sync="link"
            v-for="(link, index) in lines()"
            :key="`link${index}`"
            @deleteLink="linkDelete(link.id)">
          </flowchart-link>
          <line
            v-for="(stage, index) in stages"
            :key="index"
            :x1="scene.centerX + index * stageWidth"
            y1="0"
            :x2="scene.centerX + index * stageWidth"
            y2="100vh"
            style="stroke: rgb(100, 100, 100); stroke-width: 2"
            stroke-dasharray="5, 5"
          />
          <text
            v-for="(stage, index) in stages"
            :key="index"
            :x="scene.centerX + index * stageWidth + 50"
            y="50"
            textLength="100"
            lengthAdjust="spacing"
            style="font-size: 24px;"
          >
          {{ stage }}
          </text>
        </svg>
      </div>
      <div class="dragging-node" v-if="moving" :style="{ top: `${draggingNodeTop}px`, left: `${draggingNodeLeft}px` }">
        <div class="dragging-node-title" />
        <div class="dragging-node-label" />
      </div>
    </div>
  </div>
</template>

<script>
import FlowchartLink from './FlowchartLink.vue';
import FlowchartNode from './FlowchartNode.vue';
import { getMousePosition } from '../assets/utilty/position';

export default {
  name: 'VueFlowchart',
  props: {
    scene: {
      type: Object,
      default() {
        return {
          startNodeTitle: 'Conversation Start',
          centerX: 0,
          scale: 1,
          centerY: 0,
          nodes: [],
          links: [],
        }
      }
    },
    height: {
      type: Number,
      default: 400,
    },
    stageWidth: {
      type: Number,
      default: 500,
    },
    stages: {
      type: Object,
      default() {
        return {}
      }
    },
  },
  data() {
    return {
      action: {
        linking: false,
        dragging: false,
        scrolling: false,
        selected: 0,
      },
      mouse: {
        x: 0,
        y: 0,
        lastX: 0,
        lastY: 0,
      },
      draggingLink: null,
      rootDivOffset: {
        top: 0,
        left: 0
      },
      moving: false,
      draggingNodeTop: 0,
      draggingNodeLeft: 0,
      actionType: '',
      window: {
        width: 0,
        height: 0
      },
    };
  },
  created() {
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  },
  destroyed() {
    window.removeEventListener('resize', this.handleResize);
  },
  components: {
    FlowchartLink,
    FlowchartNode,
  },
  computed: {
    nodeOptions() {
      return {
        centerY: this.scene.centerY,
        centerX: this.scene.centerX,
        scale: this.scene.scale,
        offsetTop: this.rootDivOffset.top,
        offsetLeft: this.rootDivOffset.left,
        selected: this.action.selected,
      }
    },
  },
  mounted() {
    this.rootDivOffset.top = this.$el ? this.$el.offsetTop : 0;
    this.rootDivOffset.left = this.$el ? this.$el.offsetLeft : 0;
  },
  methods: {
    lines() {
      const lines = this.scene.links.map((link) => {
        const fromNode = this.findNodeWithID(link.from)
        const toNode = this.findNodeWithID(link.to)
        let x, y, cy, cx, ex, ey;

        x = (fromNode.centeredX || fromNode.x);
        y = (fromNode.centeredY || fromNode.y);
        [cx, cy] = this.getPortPosition(fromNode, 'right', x, y, link.button);
        x = (toNode.centeredX || toNode.x);
        y = (toNode.centeredY || toNode.y);
        [ex, ey] = this.getPortPosition(toNode, 'left', x, y);
        return { 
          start: [cx, cy], 
          end: [ex, ey],
          id: link.id,
        };
      })
      if (this.draggingLink) {
        let x, y, cy, cx;
        const fromNode = this.findNodeWithID(this.draggingLink.from);
        x = (fromNode.centeredX || fromNode.x);
        y = (fromNode.centeredY || fromNode.y);
        [cx, cy] = this.getPortPosition(fromNode, 'right', x, y, this.draggingLink.buttonIndex + 1);
        // push temp dragging link, mouse cursor postion = link end postion 
        lines.push({ 
          start: [cx, cy],
          end: [this.draggingLink.mx, this.draggingLink.my],
        })
      }
      return lines;
    },
    findNodeWithID(id) {
      return this.scene.nodes.find((item) => {
        return id === item.id
      })
    },
    getPortPosition(node, type, x, y, buttonId) {
      const labelElement = document.getElementById('node-main_' + node.id);
      let labelHeight = 0,
          labelWidth = 0;
      if (labelElement) {
        labelHeight = labelElement.offsetHeight;
        labelWidth = labelElement.offsetWidth;
      }
      let additionalHeight = 0;
      if(node.isStart) {
        const nodeStartTitleElement = document.getElementsByClassName('node-start')[0];
        additionalHeight += nodeStartTitleElement ? nodeStartTitleElement.offsetHeight : 0;
      }

      if (type === 'right') {
        let buttonIndex = null;

        if (buttonId && buttonId !== -1) {
          buttonIndex = node.buttons.findIndex((button) => button.id === buttonId);
        } else {
            if (buttonId === -1 && this.draggingLink && this.draggingLink.buttonIndex !== undefined) { // this line is important! -1 means the condition is in dragginglink
            buttonIndex = this.draggingLink.buttonIndex;
          } else {
            return [x + labelWidth, y + labelHeight/2 + additionalHeight/2]
          }
        }

        const nodeTypeElement = document.getElementById(`node-type_${node.id}`);
        if (!nodeTypeElement) { return [0, 0]; }

        const labelTitleElement = document.getElementById(`label-title_${node.id}`);
        if (!labelTitleElement) { return [0, 0]; }

        const nodeTypeHeight = nodeTypeElement.offsetHeight;
        const labelTitleHeight = labelTitleElement.offsetHeight;
        let buttonHeight = labelTitleHeight + nodeTypeHeight;

        let element = null;
        for (let i = buttonIndex; i >= 0; i--) {
          element = document.getElementById('button_' + node.id + '_' + i);
          if (!element) { continue; }
          if (i === buttonIndex) {
            buttonHeight += element.offsetHeight/1.75;
          } else {
            buttonHeight += element.offsetHeight;
          }
        }

        buttonHeight += additionalHeight;
        return [x + labelWidth, y + buttonHeight];
      }
      else if (type === 'left') {
        return [x, y + labelHeight/2 + additionalHeight/2]
      }
    },
    linkingStart(nodeId, e) {
      this.action.linking = true;
      let mx, my = null
      if (e.type.includes('mouse')) {
        [mx, my] = getMousePosition(this.$el, e);
      } else {
        [mx, my] = getMousePosition(this.$el, e);
      }
      this.draggingLink = {
        from: nodeId,
        buttonIndex: e.buttonIndex,
        mx,
        my,
      };
    },
    linkingStop(index) {
      // add new Link
      if (this.draggingLink && this.draggingLink.from !== index) {
        // check link existence
        const existed = this.scene.links.find((link) => {
          return link.from === this.draggingLink.from && (link.button ? link.button === this.findNodeWithID(link.from).buttons[this.draggingLink.buttonIndex].id : true);
        })
        if (!existed) {
          let maxID = Math.max(0, ...this.scene.links.map((link) => {
            return link.id
          }))
          const fromNode = this.findNodeWithID(this.draggingLink.from);
          const outputButtonId = fromNode.buttons && fromNode.buttons.length ? fromNode.buttons[this.draggingLink.buttonIndex].id : undefined;
          const newLink = {
            id: maxID + 1,
            from: this.draggingLink.from,
            to: index,
            button: outputButtonId,
          };
          this.scene.links.push(newLink)
          this.$emit('linkAdded', newLink)
        }
      }
      this.draggingLink = null
    },
    linkDelete(id) {
      const deletedLink = this.scene.links.find((item) => {
          return item.id === id;
      });
      if (deletedLink) {
        this.scene.links = this.scene.links.filter((item) => {
            return item.id !== id;
        });
        this.$emit('linkBreak', deletedLink);
      }
    },
    nodeSelected(id, e) {
      this.action.dragging = id;
      this.action.selected = id;
      this.$emit('nodeClick', id);
      if (e.type.includes('mouse')) {
        this.mouse.lastX = e.pageX || e.clientX + document.documentElement.scrollLeft
        this.mouse.lastY = e.pageY || e.clientY + document.documentElement.scrollTop
      } else {
        this.mouse.lastX = e.touches[0].pageX || e.touches[0].clientX + document.documentElement.scrollLeft
        this.mouse.lastY = e.touches[0].pageY || e.touches[0].clientY + document.documentElement.scrollTop
      }
    },
    handleMove(e) {
      if (this.action.linking) {
        [this.mouse.x, this.mouse.y] = getMousePosition(this.$el, e);
        if (e.type.includes('mouse')) {
          this.mouse.x = e.pageX || e.clientX + document.documentElement.scrollLeft
          this.mouse.y = e.pageY || e.clientY + document.documentElement.scrollTop
        } else {
          this.mouse.x = e.touches[0].pageX || e.touches[0].clientX + document.documentElement.scrollLeft
          this.mouse.y = e.touches[0].pageY || e.touches[0].clientY + document.documentElement.scrollTop
        }

        const titleHeight = document.getElementById("title").offsetHeight + 22;
        [this.draggingLink.mx, this.draggingLink.my] = [this.mouse.x, this.mouse.y - titleHeight];
      }
      if (this.action.dragging) {
        if (e.type.includes('mouse')) {
          this.mouse.x = e.pageX || e.clientX + document.documentElement.scrollLeft
          this.mouse.y = e.pageY || e.clientY + document.documentElement.scrollTop
        } else {
          this.mouse.x = e.touches[0].pageX || e.touches[0].clientX + document.documentElement.scrollLeft
          this.mouse.y = e.touches[0].pageY || e.touches[0].clientY + document.documentElement.scrollTop
        }
        let diffX = this.mouse.x - this.mouse.lastX;
        let diffY = this.mouse.y - this.mouse.lastY;

        this.mouse.lastX = this.mouse.x;
        this.mouse.lastY = this.mouse.y;
        this.moveSelectedNode(diffX, diffY);
      }
      if (this.action.scrolling) {
        [this.mouse.x, this.mouse.y] = getMousePosition(this.$el, e);
        let diffX = this.mouse.x - this.mouse.lastX;
        let diffY = this.mouse.y - this.mouse.lastY;

        this.mouse.lastX = this.mouse.x;
        this.mouse.lastY = this.mouse.y;

        this.scene.centerX += diffX;
        this.scene.centerY += diffY;

        this.scene.nodes = this.scene.nodes.map((node) => ({
          ...node,
          centeredX: node.centeredX + diffX,
          centeredY: node.centeredY + diffY,
          x: node.x + diffX,
          y: node.y + diffY,
        }))

        // this.hasDragged = true
      }
    },
    handleUp(e) {
      const target = e.target || e.srcElement;
      // eslint-disable-next-line
      // console.log('ini dari SimpleFlowchart.vue fungsi handleUp', this.$el);
      if (this.$el.contains(target)) {
        if (typeof target.className !== 'string' || target.className.indexOf('node-input') < 0) {
          this.draggingLink = null;
        }
        if (typeof target.className === 'string' && target.className.indexOf('node-delete') > -1) {
          // console.log('delete2', this.action.dragging);
          this.nodeDelete(this.action.dragging);
        }
      }
      this.action.linking = false;
      this.action.dragging = null;
      this.action.scrolling = false;
    },
    handleDown(e) {
      const target = e.target || e.srcElement;
      // console.log('for scroll', target, e.keyCode, e.which)
      if (target === this.$el || target.matches('svg, svg *')) {
        this.action.scrolling = true;
        [this.mouse.lastX, this.mouse.lastY] = getMousePosition(this.$el, e);
        this.action.selected = null; // deselectAll
      }
      this.$emit('canvasClick', e);
    },
    moveSelectedNode(dx, dy) {
      let index = this.scene.nodes.findIndex((item) => {
        return item.id === this.action.dragging
      })
      let left = (this.scene.nodes[index].centeredX || this.scene.nodes[index].x) + dx / this.scene.scale;
      let top = (this.scene.nodes[index].centeredY || this.scene.nodes[index].y) + dy / this.scene.scale;
      left = Math.min(left, this.scene.centerX + (this.scene.nodes[index].stage + 1) * this.stageWidth - 200);
      left = Math.max(left, this.scene.centerX + this.scene.nodes[index].stage * this.stageWidth);
      this.$set(this.scene.nodes, index, Object.assign(this.scene.nodes[index], {
        x: left,
        y: top,
        centeredX: left,
        centeredY: top
      }));
    },
    nodeDelete(id) {
      this.scene.nodes = this.scene.nodes.filter((node) => {
        return node.id !== id;
      })
      this.scene.links = this.scene.links.filter((link) => {
        return link.from !== id && link.to !== id
      })
      this.$emit('nodeDelete', id)
    },
    handleResize() {
      this.window.width = window.innerWidth;
      this.window.height = window.innerHeight;
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.flowchart{
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
  flex: 1;
}
.dragging-node{
  width: 80px;
  height: 80px;
  position: absolute;
  opacity: 0.9;
  .dragging-node-title{
    background: #ff8855;
    color: white;
    font-size: 13px;
    height: 30px;
    width: 80px;
  }
  .dragging-node-label{
    height: 50px;
    background: #FFF;
    width: 80px;
  }
}
.flowchart-toolbar{
  flex: 0.1;
  padding-top: 10px;
}
.flowchart-toolbar-item{
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-bottom: 20px;
}
.square {
  width: 30px;
  height: 30px;
  border: 1px solid black;
  margin-bottom: 10px;
}
.flowchart-container {
  flex: 0.9;
  margin: 0;
  background: #ddd;
  position: relative;
  overflow: hidden;
  svg {
    cursor: grab;
    position: relative;
  }
}
</style>
