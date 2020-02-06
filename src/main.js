import Vue from 'vue'
import Vue2TouchEvents from 'vue2-touch-events'
import vOutsideEvents from 'vue-outside-events'
import {
    LayoutPlugin, InputGroupPlugin, FormPlugin, FormGroupPlugin, FormInputPlugin,
    FormCheckboxPlugin, FormSelectPlugin, ButtonPlugin, ButtonGroupPlugin, ModalPlugin,
    PopoverPlugin, NavbarPlugin,
} from 'bootstrap-vue';
import 'bootstrap/dist/css/bootstrap.min.css';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
    faArrowRight,
    faCheck,
    faCog,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import App from './App.vue'

Vue.config.productionTip = false
Vue.use(LayoutPlugin);
Vue.use(InputGroupPlugin);
Vue.use(FormPlugin);
Vue.use(FormGroupPlugin);
Vue.use(FormInputPlugin);
Vue.use(FormCheckboxPlugin);
Vue.use(FormSelectPlugin);
Vue.use(ButtonPlugin);
Vue.use(ButtonGroupPlugin);
Vue.use(ModalPlugin);
Vue.use(PopoverPlugin);
Vue.use(NavbarPlugin);
Vue.use(Vue2TouchEvents)
Vue.use(vOutsideEvents)

library.add(faArrowRight);
library.add(faCheck);
library.add(faCog);
Vue.component('font-awesome-icon', FontAwesomeIcon);

new Vue({
  render: h => h(App)
}).$mount('#app')
