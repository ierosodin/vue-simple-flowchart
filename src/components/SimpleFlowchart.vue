<template>
  <div>
    <div id="flowchart" class="flowchart">
      <div class="flowchart-container"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        v-mouseup-outside="handleUp"
        v-touch:moving="handleTouchMove" 
        v-touch:end="handleUp"
        v-touch:start="handleTouchDown"
      >
        <flowchart-node
          v-bind.sync="node"
          v-for="(node, index) in scene.nodes"
          :ref="`node${index}`"
          :key="`node${index}`"
          :options="nodeOptions"
          @linkingStart="linkingStart(node.id, $event)"
          @linkingStop="linkingStop(node.id)"
          @nodeSelected="nodeSelected(node.id, $event)"
          @verifyNode="verifyNode(node.id)"
          @openDrawer="openDrawer(node.id)"
        >
        </flowchart-node>
        <svg width="100%" :height="`${height}px`">
          <flowchart-link v-bind.sync="link"
            v-for="(link, index) in lines()"
            :key="`link${index}`"
            @deleteLink="linkDelete(link.id)">
          </flowchart-link>
          <line
            v-for="(stage, index) in stages"
            :key="'line-' + index"
            :id="'line-' + index"
            :x1="calStageWidth(index)"
            y1="0"
            :x2="calStageWidth(index)"
            y2="100%"
            style="stroke: rgb(100, 100, 100); stroke-width: 6; cursor: col-resize"
            stroke-dasharray="20, 20"
          />
          <text
            v-for="(stage, index) in stages"
            :key="'text-' + index"
            :x="calStageWidth(index) + 50 * scene.scale"
            y="5%"
            textLength="100"
            lengthAdjust="spacing"
            style="font-size: 24px;"
          >
          {{ stage.name }}
          </text>
        </svg>
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
    stages: {
      type: Object,
      default() {
        return {}
      }
    },
    verifyNode: {
      type: Function,
      default() {
        return null
      }
    },
    resetNodeStatFromID: {
      type: Function,
      default() {
        return null
      }
    },
    openDrawer: {
      type: Function,
      default() {
        return null
      }
    },
  },
  data() {
    return {
      action: {
        linking: false,
        dragging: false,
        scrolling: false,
        movingBound: false,
        selected: 0,
        selectedBound: null,
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
    window.addEventListener('resize', this.windowsResize);
    this.windowsResize();
  },
  destroyed() {
    window.removeEventListener('resize', this.windowsResize);
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
    calStageWidth(index) {
      if (parseInt(index) > 0)
        this.stages[index].width = 
          this.stages[index - 1].width + this.stages[index - 1].widthDelta * this.scene.scale
      else
        this.stages[index].width = this.scene.centerX * this.scene.scale
      return this.stages[index].width
    },
    lines() {
      const lines = this.scene.links.map((link) => {
        const fromNode = this.findNodeWithID(link.from)
        const toNode = this.findNodeWithID(link.to)
        let x, y, cy, cx, ex, ey;

        x = fromNode.centeredX;
        y = fromNode.centeredY;
        [cx, cy] = this.getPortPosition(fromNode, 'right', x, y, link.outButton);
        x = toNode.centeredX;
        y = toNode.centeredY;
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
        x = fromNode.centeredX;
        y = fromNode.centeredY;
        [cx, cy] = this.getPortPosition(fromNode, 'right', x, y, this.draggingLink.buttonIndex);
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
      if (node.stat !== null) {
        additionalHeight += 40;
      }
      if (type === 'right') {
        let buttonIndex = null;

        if (buttonId === -1) {
          return [(x + labelWidth) * this.scene.scale, (y + labelHeight/2 + additionalHeight/2 - 4) * this.scene.scale]
        }
        buttonIndex = node.outButtons.findIndex((button) => button.id === buttonId);

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
            buttonHeight += element.offsetHeight/1.5;
          } else {
            buttonHeight += element.offsetHeight;
          }
        }

        buttonHeight += additionalHeight;
        return [(x + labelWidth) * this.scene.scale, (y + buttonHeight) * this.scene.scale];
      }
      else if (type === 'left') {
        return [(x) * this.scene.scale, (y + labelHeight/2 + additionalHeight/2 - 4) * this.scene.scale]
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
          return link.from === this.draggingLink.from &&
            link.to === index &&
            (link.outButton !== -1 ? link.outButton === this.findNodeWithID(link.from).outButtons[this.draggingLink.buttonIndex].id : true);
        })
        const fromNode = this.findNodeWithID(this.draggingLink.from);
        const toNode = this.findNodeWithID(index);
        const valid = Math.abs(fromNode.stage - toNode.stage) <= 1;
        if (!existed && valid) {
          let maxID = Math.max(-1, ...this.scene.links.map((link) => {
            return link.id
          }))
          const outputButtonId = fromNode.outButtons && fromNode.outButtons.length ? fromNode.outButtons[this.draggingLink.buttonIndex].id : -1;
          const newLink = {
            id: maxID + 1,
            from: this.draggingLink.from,
            to: index,
            outButton: outputButtonId,
          };
          // add link info to node
          toNode.upStream.push({
            id: this.draggingLink.from,
            button: outputButtonId,
          })
          if (this.cyclicExist()) {
            toNode.upStream.pop();
            this.draggingLink = null;
            return;
          }
          this.scene.links.push(newLink);
          toNode.stat = 'warning';
          this.resetNodeStatFromID(index);
          this.$emit('linkAdded', newLink)
        }
      }
      this.draggingLink = null;
    },
    linkDelete(id) {
      const deletedLink = this.scene.links.find((item) => {
          return item.id === id;
      });
      if (deletedLink) {
        const linkIndex = this.scene.links.findIndex((item) => {
          return item.id === id;
        });
        // update upstream info for all downstream nodes
        const toNode = this.findNodeWithID(this.scene.links[linkIndex].to)
        toNode.upStream = toNode.upStream.filter((item) => {
          return (item.id !== this.scene.links[linkIndex].from) || (item.button !== this.scene.links[linkIndex].outButton);
        });
        // update stat for all downstream nodes
        toNode.stat = 'warning';
        this.resetNodeStatFromID(this.scene.links[linkIndex].to);
        this.scene.links.splice(linkIndex, 1);
        this.$emit('linkBreak', deletedLink);
      }
    },
    cyclicExist() {
      let Q = [];
      let E = [];
      this.scene.nodes.forEach((node) => {
        if (node.upStream.length < 1)
          Q.push(Object.assign({}, node));
        else
          E.push(Object.assign({}, node));
      });
      while (Q.length > 0) {
        const QNode = Q.pop();
        let newE = [];
        E.forEach((node) => {
          node.upStream = node.upStream.filter((upNode) => {
            return upNode.id !== QNode.id;
          });
          if (node.upStream.length < 1)
            Q.push(node);
          else
            newE.push(node);
        });
        E = newE;
      }
      if (E.length > 0)
        return true;
      return false;
    },
    nodeSelected(id, e) {
      this.action.dragging = true;
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

        const scrollY = document.getElementById("app").scrollTop;
        const titleHeight = document.getElementById("title").offsetHeight + 22 + 87;
        [this.draggingLink.mx, this.draggingLink.my] = [this.mouse.x, this.mouse.y - titleHeight + scrollY];
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

        this.scene.centerX += diffX / this.scene.scale;
        this.scene.centerY += diffY / this.scene.scale;

        this.scene.nodes = this.scene.nodes.map((node) => ({
          ...node,
          centeredX: node.centeredX + diffX / this.scene.scale,
          centeredY: node.centeredY + diffY / this.scene.scale,
        }))
      }
      if (this.action.movingBound) {
        [this.mouse.x, this.mouse.y] = getMousePosition(this.$el, e);
        const diffX = (this.mouse.x - this.mouse.lastX) / this.scene.scale;

        this.mouse.lastX = this.mouse.x;

        if (this.action.selectedBound > 0
          && (this.stages[this.action.selectedBound - 1].width - diffX + 200
            * this.scene.scale) < this.stages[this.action.selectedBound].width) {
          this.stages[this.action.selectedBound - 1].widthDelta += diffX;
          [...Array(this.scene.nodes.length).keys()].forEach((i) => {
            if (this.scene.nodes[i].stage >= this.action.selectedBound) {
              this.$set(this.scene.nodes, i, Object.assign(this.scene.nodes[i], {
                centeredX: this.scene.nodes[i].centeredX + diffX,
                centeredY: this.scene.nodes[i].centeredY
              }));
            } else {
              if ((this.scene.nodes[i].centeredX + 200) * this.scene.scale > this.calStageWidth(this.action.selectedBound))
                this.$set(this.scene.nodes, i, Object.assign(this.scene.nodes[i], {
                  centeredX: this.calStageWidth(this.action.selectedBound) / this.scene.scale - 200,
                  centeredY: this.scene.nodes[i].centeredY
                }));
            }
          });
        }
      }
    },
    handleUp(e) {
      const target = e.target || e.srcElement;
      // eslint-disable-next-line
      if (this.$el.contains(target)) {
        if (typeof target.className !== 'string' || target.className.indexOf('node-input') < 0) {
          this.draggingLink = null;
        }
        if (typeof target.className === 'string' && target.className.indexOf('node-delete') > -1) {
          this.nodeDelete(this.action.selected);
        }
      }
      this.action.linking = false;
      this.action.dragging = false;
      this.action.scrolling = false;
      this.action.movingBound = false;
      this.action.selected = null;
      this.action.selectedBound = null;
    },
    handleDown(e) {
      const target = e.target || e.srcElement;
      if (target === this.$el || target.matches('line, line *')) {
        this.action.selectedBound = target.id.split('-')[1];
        if (this.action.selectedBound > 0)
          this.action.movingBound = true;
        else
          this.action.scrolling = true;
        [this.mouse.lastX, this.mouse.lastY] = getMousePosition(this.$el, e);
        this.action.selected = null; // deselectAll
      }
      else if (target === this.$el || target.matches('svg, svg *')) {
        this.action.scrolling = true;
        [this.mouse.lastX, this.mouse.lastY] = getMousePosition(this.$el, e);
        this.action.selected = null; // deselectAll
      }
      this.$emit('canvasClick', e);
    },
    handleMouseMove(e) {
      if (e.type.includes('mouse')) {
        this.handleMove(e);
      }
    },
    handleMouseDown(e) {
      if (e.type.includes('mouse')) {
        this.handleDown(e);
      }
    },
    handleTouchMove(e) {
      if (e.type.includes('touch')) {
        this.handleMove(e);
      }
    },
    handleTouchDown(e) {
      if (e.type.includes('touch')) {
        this.handleDown(e);
      }
    },
    moveSelectedNode(dx, dy) {
      let index = this.scene.nodes.findIndex((item) => {
        return item.id === this.action.selected
      })
      let left = this.scene.nodes[index].centeredX + dx / this.scene.scale;
      let top = this.scene.nodes[index].centeredY + dy / this.scene.scale;
      if (this.scene.nodes[index].stage + 1 < Object.keys(this.stages).length) {
        left = Math.min(left, this.calStageWidth(this.scene.nodes[index].stage + 1) / this.scene.scale - 200);
      }
      left = Math.max(left, this.calStageWidth(this.scene.nodes[index].stage) / this.scene.scale);
      this.$set(this.scene.nodes, index, Object.assign(this.scene.nodes[index], {
        centeredX: left,
        centeredY: top
      }));
    },
    nodeDelete(id) {
      this.scene.links.forEach((link) => {
        if (link.from === id) {
          const toNode = this.findNodeWithID(link.to);
          toNode.upStream = toNode.upStream.filter((item) => {
            return item.id !== id;
          });
        }
      });
      const removeList = this.scene.links.filter((link) => {
        return link.from === id || link.to === id
      });
      removeList.forEach((link) => {
        this.linkDelete(link.id);
      });
      this.scene.nodes = this.scene.nodes.filter((node) => {
        return node.id !== id;
      })
      this.$emit('nodeDelete', id)
    },
    windowsResize() {
      this.window.width = window.innerWidth;
      this.window.height = window.innerHeight;
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.flowchart {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
  flex: 1;
  max-height: 80vh;
  overflow-y: hidden;
}
.flowchart-container {
  flex: 1;
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
