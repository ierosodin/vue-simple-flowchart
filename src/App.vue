<template>
  <div id="app">
    <div id="title">
      <h1> simple flowchart</h1>
      <button @click="isPanelShow = !isPanelShow">{{!isPanelShow ? 'Show Panel' : 'Hide Panel'}}</button>
      <button v-if="isPanelShow" @click="isRawScene = !isRawScene">{{!isRawScene ? 'Show Raw' : 'Show Pretty'}}</button>
      <div v-if="isPanelShow" class="panel-area">
        <div v-html="isRawScene ? rawScene : prettyScene" class="extraction-panel" />
      </div>
    </div>
    <br>
    <div class="flowchart">
      <h2 style="overflow-x: auto">
        <nobr
          v-for="(stage, index) in stages"
          :key="index"
        >
          <b-button
            variant="outline-dark"
            size="lg"
            @click="newStageType=index; $bvModal.show('createModal')"
          >
            {{ stage.name }}
          </b-button>
          &nbsp;
          <font-awesome-icon
            v-if="parseInt(index) + 1 < Object.keys(stages).length"
            :icon="['fas', 'arrow-right']"
            size="lg"
          />
          &nbsp;
        </nobr>
      </h2>
      <b-row align-h="end">
        <b-col sm="1">
          <label>Scale:</label>
        </b-col>
        <b-col sm="3">
          <b-form-input type="range" v-model="scene.scale" min=0 max=1 step=0.1></b-form-input>
        </b-col>
      </b-row>
      <simple-flowchart :scene.sync="scene" 
        @nodeClick="nodeClick"
        @nodeDelete="nodeDelete"
        @linkBreak="linkBreak"
        @linkAdded="linkAdded"
        @canvasClick="canvasClick"
        :verifyNode="verifyNode"
        :resetNodeStatFromID="resetNodeStatFromID"
        :stages.sync="stages"
        :height="1200"/>
    </div>
    <b-modal
      id="createModal"
      ref="createModal"
      class="modal-backdrop fade"
      title="New Node"
      hide-footer
      hide-backdrop
    >
      <b-form
        class="w-100"
        @submit="onCreateFormSubmit"
        @reset="onCreateFormReset"
      >
        <b-form-select v-model="newNodeType" class="mb-3" required>
          <b-form-select-option :value="null" disabled>Please select a node type</b-form-select-option>
          <b-form-select-option
            v-for="(category, index) in nodeInStage(parseInt(newStageType))"
            :key="'category-' + index"
            :value="index"
          >
            {{ category.name }}
          </b-form-select-option>
        </b-form-select>
        <br>
        <b-button-group>
          <b-button
            type="submit"
            variant="primary"
          >
            <b>Submit</b>
          </b-button>
          &nbsp;
          <b-button
            type="reset"
            variant="danger"
          >
            <b>Cancel</b>
          </b-button>
        </b-button-group>
      </b-form>
    </b-modal>
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
        centerX: 50,
        centerY: 0,
        scale: 1,
        nodes: [],
        links: [],
      },
      newNodeType: null,
      nodeCategory: [
        {
          name: 'nodeType1',
          stage: 0,
          start: true,
          outButtons: [],
        },
        {
          name: 'nodeType2',
          stage: 1,
          start: false,
          outButtons: [],
        },
        {
          name: 'nodeType3',
          stage: 2,
          start: false,
          outButtons: [{
            id: 0,
            text: 'Option 1'
          }, {
            id: 1,
            text: 'Option 2'
          }, {
            id: 2,
            text: 'Option 3'
          }]
        },
        {
          name: 'nodeType4',
          stage: 2,
          start: false,
          outButtons: [],
        },
        {
          name: 'nodeType5',
          stage: 2,
          start: false,
          outButtons: [],
        },
        {
          name: 'nodeType6',
          stage: 2,
          start: false,
          outButtons: [],
        },
        {
          name: 'nodeType7',
          stage: 3,
          start: false,
          outButtons: [],
        },
      ],
      newStageType: null,
      stages: {
        0: {
          name: 'stage1',
          width: 0,
          widthDelta: 500,
        },
        1: {
          name: 'stage2',
          width: 0,
          widthDelta: 500,
        },
        2: {
          name: 'stage3',
          width: 0,
          widthDelta: 500,
        },
        3: {
          name: 'stage4',
          width: 0,
          widthDelta: 500,
        },
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
    nodeInStage(stage) {
      return this.nodeCategory.filter((category) => {
        return category.stage === stage;
      });
    },
    verifyNode(id) {
      const node = this.findNodeWithID(id);
      if (node.upStream.length === 0 && !node.start) {
        node.stat = 'error';
      } else {
        node.stat = 'success';
        node.upStream.forEach((upNode) => {
          if (this.findNodeWithID(upNode.id).stat !== 'success') node.stat = 'error';
        });
      }
    },
    resetNodeStatFromID(id) {
      this.scene.nodes.forEach((node) => {
        node.upStream.forEach((upNode) => {
          if (upNode.id === id) {
            node.stat = 'warning';
            this.resetNodeStatFromID(node.id);
          }
        });
      });
    },
    findNodeWithID(id) {
      return this.scene.nodes.find((item) => {
        return id === item.id
      })
    },
    canvasClick(e) {
      // console.log('canvas Click, event:', e)
      return
    },
    addNode(stat) {
      let maxID = Math.max(-1, ...this.scene.nodes.map((node) => {
        return node.id;
      }))
      const stageNodeCategory = this.nodeInStage(parseInt(this.newStageType))
      this.scene.nodes.push({
        id: maxID + 1,
        centeredX: this.stages[stageNodeCategory[this.newNodeType].stage].width / this.scene.scale,
        centeredY: this.scene.centerY + 50,
        type: stageNodeCategory[this.newNodeType].name,
        stage: stageNodeCategory[this.newNodeType].stage,
        taskId: `${stageNodeCategory[this.newNodeType].name}_${maxID + 1}`,
        start: stageNodeCategory[this.newNodeType].start,
        outButtons: stageNodeCategory[this.newNodeType].outButtons,
        stat: stat,
        upStream: [],
      })
    },
    nodeClick(id) {
      // console.log('node click', id);
      return
    },
    nodeDelete(id) {
      // console.log('node delete', id);
      return
    },
    linkBreak(id) {
      // console.log('link break', id);
      return
    },
    linkAdded(link) {
      // console.log('new link added:', link);
      return
    },
    onCreateFormSubmit(e) {
      e.preventDefault();
      this.addNode('warning');
      this.newNodeType = null;
      this.$refs.createModal.hide();
    },
    onCreateFormReset(e) {
      e.preventDefault();
      this.newNodeType = null;
      this.$refs.createModal.hide();
    },
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
  overflow-y: scroll;
  overflow-x: hidden;
  height: 100vh;
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
  .flowchart {
    max-height: 70vh;
  }
}
</style>
