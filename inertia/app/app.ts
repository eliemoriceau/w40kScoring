/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />

import '../css/app.css'
import { createSSRApp, h } from 'vue'
import type { DefineComponent } from 'vue'
import { createInertiaApp } from '@inertiajs/vue3'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import telemetry from '~/utils/telemetry'

const appName = import.meta.env.VITE_APP_NAME || 'W40K Scoring'

createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title) => `${title} - ${appName}`,

  resolve: (name) => {
    return resolvePageComponent(
      `../pages/${name}.vue`,
      import.meta.glob<DefineComponent>('../pages/**/*.vue')
    )
  },

  setup({ el, App, props, plugin }) {
    const vueApp = createSSRApp({ render: () => h(App, props) }).use(plugin)

    // Configure Vue error handler pour telemetry
    vueApp.config.errorHandler = (error: Error, instance: any, info: string) => {
      telemetry.trackBusinessEvent('vue_error', {
        error_message: error.message,
        error_info: info,
        component_name: instance?.$options?.name || 'unknown',
        stack: error.stack || 'No stack trace',
      })

      // Log aussi dans console en développement
      if (import.meta.env.DEV) {
        console.error('Vue error:', error, info)
      }
    }

    // Initialize telemetry with user context if available
    if (props.initialPage.props.user) {
      telemetry.setUserContext(props.initialPage.props.user.id)
    }

    // Track app initialization
    telemetry.trackBusinessEvent('app_initialized', {
      app_version: '1.0.0',
      environment: import.meta.env.MODE,
    })

    return vueApp.mount(el)
  },
})
