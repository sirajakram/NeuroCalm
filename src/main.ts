import { CreateStartUpPageContainer, OsEventTypeList, TextContainerProperty, TextContainerUpgrade, waitForEvenAppBridge } from '@evenrealities/even_hub_sdk'

const exercises = [
  ['PAUSE', 'Find a quieter space.\n\nYou do not need to solve everything at once.'],
  ['GROUND', 'Name 5 things you can see.\n\nThen notice 4 things you can feel.'],
  ['BREATHE', 'Breathe in for 4.\nHold for 2.\nBreathe out for 6.'],
  ['RESET', 'Drink water.\n\nTake a five-minute break if you can.'],
]

const hostWindow = window as Window & { flutter_inappwebview?: { callHandler?: unknown } }
if (typeof hostWindow.flutter_inappwebview?.callHandler === 'function') await startNative()
else showWebPreview()

async function startNative() {
const bridge = await waitForEvenAppBridge()
const saved = await bridge.getLocalStorage('neurocalm-step')
let step = Math.min(Math.max(Number(saved ?? 0), 0), exercises.length - 1)

function screen() {
  const [heading, body] = exercises[step]
  return `NEUROCALM\n\n${heading}\n${body}\n\n${step + 1}/${exercises.length}\n\nTap: next   Swipe: previous/next\nDouble-tap: exit`
}

const main = new TextContainerProperty({ xPosition: 0, yPosition: 0, width: 576, height: 288, borderWidth: 1, borderColor: 4, paddingLength: 12, containerID: 1, containerName: 'calm', content: screen(), textColor: 3, isEventCapture: 1 })
const result = await bridge.createStartUpPageContainer(new CreateStartUpPageContainer({ containerTotalNum: 1, textObject: [main] }))
if (result !== 0) console.error('Unable to create NeuroCalm page:', result)
async function render() { await bridge.setLocalStorage('neurocalm-step', String(step)); await bridge.textContainerUpgrade(new TextContainerUpgrade({ containerID: 1, containerName: 'calm', content: screen() })) }
bridge.onEvenHubEvent((event) => {
  // Swipes are emitted by the text container; temple taps are system events.
  const type = event.sysEvent?.eventType ?? event.textEvent?.eventType
  const isSystemGesture = Boolean(event.sysEvent)
  const isMainText = event.textEvent?.containerID === 1

  if (type === OsEventTypeList.DOUBLE_CLICK_EVENT && (isSystemGesture || isMainText)) {
    void bridge.shutDownPageContainer()
    return
  }
  if (type === OsEventTypeList.CLICK_EVENT && (isSystemGesture || isMainText)) { step = (step + 1) % exercises.length; void render(); return }
  if (!isMainText) return
  if (type === OsEventTypeList.SCROLL_BOTTOM_EVENT) { step = (step + 1) % exercises.length; void render() }
  if (type === OsEventTypeList.SCROLL_TOP_EVENT) { step = (step + exercises.length - 1) % exercises.length; void render() }
})
}

function showWebPreview() {
  document.body.innerHTML = `<main style="margin:0;min-height:100vh;display:grid;place-items:center;background:#08100c;color:#d9ffe8;font:18px/1.5 ui-monospace,monospace"><section style="width:min(576px,calc(100vw - 48px));border:1px solid #64b981;padding:28px;box-sizing:border-box"><small>NEUROCALM · WEB PREVIEW</small><h1 style="font-size:26px;font-weight:500">Take one small pause.</h1><p>□ Find a quieter space<br>□ Drink water<br>□ Breathe in · 4<br>□ Breathe out · 6</p><footer style="color:#9ccaae">This preview is for the browser. The G2 simulator uses the native glasses display.</footer></section></main>`
}
