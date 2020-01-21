import Vue from 'vue'
import Vue2TouchEvents from 'vue2-touch-events'
import {
    LayoutPlugin, InputGroupPlugin, FormPlugin, FormGroupPlugin, FormInputPlugin,
    FormCheckboxPlugin, FormSelectPlugin, ButtonPlugin, ButtonGroupPlugin, ModalPlugin,
    PopoverPlugin, NavbarPlugin,
} from 'bootstrap-vue';
import 'bootstrap/dist/css/bootstrap.min.css';
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

new Vue({
  render: h => h(App)
}).$mount('#app')
