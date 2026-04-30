import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }

export function initGSAP() {
  gsap.config({
    nullTargetWarn: false,
  })

  ScrollTrigger.config({
    limitCallbacks: true,
  })

  return gsap
}

export default { gsap, ScrollTrigger, initGSAP }