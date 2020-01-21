<template>
  <div id="app">
    <div id="title">
      <h1> simple flowchart</h1>
      <div class="tool-wrapper">
        <select v-model="newNodeType">
          <option v-for="(item, index) in nodeCategory" :key="index" :value="index">
            {{ item.name }}
          </option>
        </select>
        <input type="text" v-model="newNodeLabel" placeholder="Input node label">
        <button @click="addNode">ADD</button>
      </div>
      <button @click="isPanelShow = !isPanelShow">{{!isPanelShow ? 'Show Panel' : 'Hide Panel'}}</button>
      <button v-if="isPanelShow" @click="isRawScene = !isRawScene">{{!isRawScene ? 'Show Raw' : 'Show Pretty'}}</button>
      <div v-if="isPanelShow" class="panel-area">
        <div v-html="isRawScene ? rawScene : prettyScene" class="extraction-panel" />
      </div>
    </div>
    
    <simple-flowchart :scene.sync="scene" 
      @nodeClick="nodeClick"
      @nodeDelete="nodeDelete"
      @linkBreak="linkBreak"
      @linkAdded="linkAdded"
      @canvasClick="canvasClick"
      :height="800"/>
  </div>
</template>

<script>
/* eslint-disable */
import SimpleFlowchart from './components/SimpleFlowchart.vue'

export default {
  name: 'app',
  components: {
    SimpleFlowchart
  },
  data() {
    return {
      isRawScene: false,
      isPanelShow: false,
      scene: {
        startNodeTitle: 'Conversation Start',
        centerX: 50,
        centerY: 0,
        scale: 1,
        nodes: [],
        links: [],
      },
      newNodeType: null,
      newNodeLabel: '',
      nodeCategory: [
        {
          name: 'nodeType1',
          stage: 0,
        },
        {
          name: 'nodeType2',
          stage: 0,
        },
        {
          name: 'nodeType3',
          stage: 1,
          buttons: [{
            id: 1,
            text: 'Option 1'
          }, {
            id: 2,
            text: 'Option 2'
          }, {
            id: 3,
            text: 'Option 3'
          }]
        },
        {
          name: 'nodeType4',
          stage: 2,
        },
        {
          name: 'nodeType5',
          stage: 3,
        },
        {
          name: 'nodeType6',
          stage: 4,
        },
        {
          name: 'nodeType7',
          stage: 5,
        },
      ],
      stages: {
        0: 'stage1',
        1: 'stage2',
        2: 'stage3',
        3: 'stage4',
        4: 'stage5',
        5: 'stage6',
      },
    }
  },
  computed: {
    prettyScene() {
      return JSON.stringify(this.scene, null, '\t').replace(/\n/gi, '<br />').replace(/\t/gi, '&nbsp;&nbsp;')
    },
    rawScene() {
      return JSON.stringify(this.scene);
    }
  },
  methods: {
    canvasClick(e) {
      console.log('canvas Click, event:', e)
    },
    addNode() {
      let maxID = Math.max(0, ...this.scene.nodes.map((link) => {
        return link.id
      }))
      this.scene.nodes.push({
        id: maxID + 1,
        x: this.scene.centerX + this.nodeCategory[this.newNodeType].stage * 500,
        y: this.scene.centerY + 50,
        type: this.nodeCategory[this.newNodeType].name,
        stage: this.nodeCategory[this.newNodeType].stage,
        label: this.newNodeLabel ? this.newNodeLabel: `test${maxID + 1}`,
        buttons: this.nodeCategory[this.newNodeType].buttons,
      })
    },
    nodeClick(id) {
      console.log('node click', id);
    },
    nodeDelete(id) {
      console.log('node delete', id);
    },
    linkBreak(id) {
      console.log('link break', id);
    },
    linkAdded(link) {
      console.log('new link added:', link);
    }
  }
}
</script>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 0;
  overflow: hidden;
  height: 95vh;
  .tool-wrapper {
    position: relative;
  }
  .panel-area {
    display: flex;
    flex-grow: 1;
    justify-content: center; 
  }
  .extraction-panel {
    text-align: left;
    width: 60%;
    max-height: 300px;
    border-width: 3px;
    border-style: solid;
    padding: 10px;
    border-color: grey;
    border-radius: 10px;
    overflow: scroll;
  }
}
</style>
