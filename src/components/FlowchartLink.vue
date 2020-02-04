<template>
  <g @mouseover="handleMouseOver"
    @mouseleave="handleMouseLeave">
    <path :d="dAttr" class="path-style"></path>
    <a v-if="show.delete" @click="deleteLink">
      <text 
        text-anchor="middle" 
        :transform="arrowTransform"
        class="times-style"
        font-size="30">&times;</text>
    </a>
    <path v-else d="M -1 -1 L 0 1 L 1 -1 z"
      class="arrow-style"
      :transform="arrowTransform"></path>
  </g>
</template>

<script>
export default {
  name: 'FlowchartLink',
  props: {
    // start point position [x, y]
    start: {
      type: Array,
      default() {
        return [0, 0]
      }
    },
    // end point position [x, y]
    end: {
      type: Array,
      default() {
        return [0, 0]
      }
    },
    id: Number,
  },
  data() {
    return {
      show: {
        delete: false,
      }
    }
  },
  methods: {
    handleMouseOver() {
      this.show.delete = true;
    },
    handleMouseLeave() {
      this.show.delete = false;
    },
    calculateCenterPoint() {
      // calculate arrow position: the center point between start and end
      const dx = (this.end[0] - this.start[0]) / 2;
      const dy = (this.end[1] - this.start[1]) / 2;
      return [this.start[0] + dx, this.start[1] + dy];
    },
    calculateRotation() {
      // calculate arrow rotation
      let deltaX = this.end[0] - this.start[0];
      deltaX = deltaX > 10 ? deltaX *= 0.2 : deltaX;
      let deltaY = this.end[1] - this.start[1];
      const angle = -Math.atan2(deltaX, deltaY);
      const degree = angle * 180 / Math.PI;
      return degree < 0 ? degree + 360 : degree;
    },
    deleteLink() {
      this.$emit('deleteLink')
    }
  },
  computed: {
    arrowTransform() {
      const [arrowX, arrowY] = this.calculateCenterPoint();
      const degree = this.calculateRotation()
      return `translate(${arrowX}, ${arrowY}) rotate(${degree})`;
    },
    dAttr() {
      let cx = this.start[0], cy = this.start[1], ex = this.end[0], ey = this.end[1];
      let x1 = cx, y1 = cy, x2 = ex, y2 = ey;
      x1 += (ex - cx) * 0.8;
      x2 -= (ex - cx) * 0.8;
      return `M ${cx}, ${cy} C ${x1}, ${y1}, ${x2}, ${y2}, ${ex}, ${ey}`;
    }
  }
}
</script>

<style scoped lang="scss">
$themeColor: rgb(120, 120, 120);
g {
  cursor: pointer;
}
.path-style {
  stroke: #{$themeColor};
  opacity: 0.9;
  stroke-width: 3;
  fill: none;
}
.times-style {
  stroke: #ff0000;
  opacity: 0.9;
  stroke-width: 2;
  fill: none;
}
.arrow-style {
  stroke: #{$themeColor};
  opacity: 0.9;
  stroke-width: 6;
  fill: none;
}
</style>
