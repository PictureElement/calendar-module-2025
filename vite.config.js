import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from "vite-plugin-svgr"
import UnoCSS from 'unocss/vite'
import {
  presetTypography,
  presetWind3,
} from 'unocss'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
    UnoCSS({
      presets: [
        presetWind3(), // required!
        presetTypography(),
      ],
    })],
})
