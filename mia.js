// Mia — Charity Driver's AI Assistant
// Warm, human, compassionate. Not a robot.

import { supabase } from './supabase.js'

const MIA_PERSONALITY = `You are Mia, the compassionate guide for Charity Driver — a platform connecting donors to unhoused individuals in Oakland, CA.

Your personality:
- Warm, human, and emotionally intelligent
- Patient and clear — never rushed or robotic
- Mission-driven: you believe in service, sacrifice, and showing up for others
- You speak like a trusted friend who knows the platform well

Your mission:
Charity Driver exists because people WANT to help — not because they have to. The platform is rooted in compassion, devotion, and the belief that ordinary people can do extraordinary things.

Platform knowledge:
- The map shows 10 Oakland hotspots with color-coded urgency (red=high need, orange=moderate, yellow=some need, green=recently served)
- Guest access: browse the map without an account. Sign up to log deliveries.
- Free tier: map access, delivery logging, live feed
- Supporter tier ($7/mo): full individual profile access, advanced tracking
- Delivery logging: select location, resources, people served → submits and updates live feed
- Individual profiles: private, consent-based profiles of people donors have met. Subscriber-only.
- Profiles use first name/alias only — dignity and privacy always come first
- The admin dashboard is for Paris (founder) and approved admins only

Navigation:
- Home: /index.html
- Map: /map.html
- Sign up: /signup.html
- Log in: /login.html
- Log a delivery: /deliver.html
- Dashboard: /dashboard.html
- People we serve (profiles): /profiles-directory.html
- About: /about.html
- Contact/Partner: /contact.html
- Privacy: /privacy.html

Rules:
- Never make up features that don't exist
- If you don't know something, say so honestly and direct to contact page
- Always be warm — never cold or transactional
- Keep answers concise but complete
- When relevant, include a direct link to the right page
- Never say "AI-powered" — you are Mia, a guide, not a tech product`

// Knowledge base cache
let knowledgeBase = []

async function loadKnowledgeBase() {
  const { data } = await supabase.from('mia_knowledge').select('*')
  knowledgeBase = data || []
}

function findKBMatch(question) {
  const q = question.toLowerCase()
  return knowledgeBase.find(entry =>
    q.includes(entry.question.toLowerCase()) ||
    entry.question.toLowerCase().includes(q.split(' ').filter(w => w.length > 3)[0] || '')
  )
}

async function logQuestion(question) {
  await supabase.from('mia_logs').insert({ question, created_at: new Date().toISOString() }).catch(() => {})
}

// Build the chat UI
export function initMia() {
  if (document.getElementById('mia-widget')) return

  const widget = document.createElement('div')
  widget.id = 'mia-widget'
  widget.innerHTML = `
    <style>
      #mia-btn { position:fixed; bottom:1.5rem; right:1.5rem; width:56px; height:56px; border-radius:50%; background:var(--gold,#F5A623); border:none; cursor:pointer; font-size:1.5rem; box-shadow:0 4px 20px rgba(245,166,35,0.4); z-index:999; transition:transform 0.2s; display:flex;align-items:center;justify-content:center; }
      #mia-btn:hover { transform:scale(1.08); }
      #mia-box { position:fixed; bottom:5rem; right:1.5rem; width:340px; max-height:520px; background:#112240; border:1px solid rgba(245,166,35,0.25); border-radius:20px; box-shadow:0 8px 40px rgba(0,0,0,0.5); z-index:998; display:none; flex-direction:column; overflow:hidden; font-family:'Inter',sans-serif; }
      #mia-box.open { display:flex; }
      #mia-header { background:rgba(245,166,35,0.08); border-bottom:1px solid rgba(245,166,35,0.15); padding:1rem 1.25rem; display:flex; align-items:center; gap:0.75rem; }
      #mia-header .avatar { width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,rgba(245,166,35,0.3),rgba(245,166,35,0.1));border:2px solid rgba(245,166,35,0.4);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0; }
      #mia-header .info .name { font-weight:800;font-size:0.9rem;color:#fff; }
      #mia-header .info .status { font-size:0.72rem;color:#F5A623; }
      #mia-close { margin-left:auto;background:none;border:none;color:#8892b0;cursor:pointer;font-size:1.1rem;padding:0.25rem; }
      #mia-messages { flex:1; overflow-y:auto; padding:1rem; display:flex; flex-direction:column; gap:0.75rem; }
      .mia-msg { max-width:85%; padding:0.75rem 1rem; border-radius:14px; font-size:0.85rem; line-height:1.6; }
      .mia-msg.mia { background:rgba(245,166,35,0.08);border:1px solid rgba(245,166,35,0.15);color:#ccd6f6;border-radius:4px 14px 14px 14px; }
      .mia-msg.user { background:#F5A623;color:#0A1628;font-weight:600;align-self:flex-end;border-radius:14px 14px 4px 14px; }
      .mia-msg a { color:#F5A623;font-weight:700; }
      .mia-msg.mia a { color:#F5A623; }
      .mia-msg.user a { color:#0A1628; }
      .mia-typing { display:flex;gap:4px;align-items:center;padding:0.5rem 0; }
      .mia-typing span { width:6px;height:6px;border-radius:50%;background:#F5A623;animation:bounce 1.2s infinite; }
      .mia-typing span:nth-child(2){animation-delay:0.2s}
      .mia-typing span:nth-child(3){animation-delay:0.4s}
      @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
      #mia-suggestions { padding:0 1rem 0.75rem; display:flex; gap:0.4rem; flex-wrap:wrap; }
      .mia-sug { font-size:0.72rem; background:rgba(245,166,35,0.08); border:1px solid rgba(245,166,35,0.2); border-radius:20px; padding:0.3rem 0.7rem; color:#F5A623; cursor:pointer; transition:all 0.15s; white-space:nowrap; }
      .mia-sug:hover { background:rgba(245,166,35,0.15); }
      #mia-input-row { border-top:1px solid rgba(245,166,35,0.12); padding:0.75rem 1rem; display:flex; gap:0.5rem; }
      #mia-input { flex:1;background:#0A1628;border:1px solid rgba(245,166,35,0.2);border-radius:10px;padding:0.6rem 0.9rem;color:#fff;font-family:inherit;font-size:0.85rem; }
      #mia-input:focus{outline:none;border-color:#F5A623;}
      #mia-send { background:#F5A623;border:none;border-radius:8px;width:36px;height:36px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    </style>

    <button id="mia-btn" title="Chat with Mia">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 4C10 4 6 7 6 11C6 13.5 7.5 15.5 9 17L14 24L19 17C20.5 15.5 22 13.5 22 11C22 7 18 4 14 4Z" fill="#0A1628"/>
        <circle cx="11" cy="11" r="1.5" fill="#0A1628"/>
        <circle cx="17" cy="11" r="1.5" fill="#0A1628"/>
        <path d="M11 14.5C11 14.5 12 16 14 16C16 16 17 14.5 17 14.5" stroke="#0A1628" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>

    <div id="mia-box">
      <div id="mia-header">
        <div class="avatar">🧡</div>
        <div class="info">
          <div class="name">Mia</div>
          <div class="status">● Your Charity Driver guide</div>
        </div>
        <button id="mia-close">✕</button>
      </div>
      <div id="mia-messages"></div>
      <div id="mia-suggestions">
        <span class="mia-sug" onclick="miaAsk('How do I sign up?')">How do I sign up?</span>
        <span class="mia-sug" onclick="miaAsk('What is Charity Driver?')">What is this?</span>
        <span class="mia-sug" onclick="miaAsk('How do I log a delivery?')">Log a delivery</span>
        <span class="mia-sug" onclick="miaAsk('What do the colors mean?')">Map colors</span>
      </div>
      <div id="mia-input-row">
        <input id="mia-input" placeholder="Ask Mia anything..." />
        <button id="mia-send">→</button>
      </div>
    </div>
  `
  document.body.appendChild(widget)

  loadKnowledgeBase()

  const btn = document.getElementById('mia-btn')
  const box = document.getElementById('mia-box')
  const closeBtn = document.getElementById('mia-close')
  const input = document.getElementById('mia-input')
  const send = document.getElementById('mia-send')
  const messages = document.getElementById('mia-messages')

  let opened = false

  btn.addEventListener('click', () => {
    box.classList.toggle('open')
    if (!opened) {
      opened = true
      addMessage('mia', "Hey there 🧡 I'm Mia — I'm here to help you find your way around Charity Driver. Ask me anything, whether it's how to sign up, what the map colors mean, or how we protect people's privacy. I've got you.")
    }
  })
  closeBtn.addEventListener('click', () => box.classList.remove('open'))

  send.addEventListener('click', handleSend)
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSend() })

  window.miaAsk = function(q) {
    input.value = q
    handleSend()
  }

  // Voice toggle state
  let voiceEnabled = false

  // Add voice toggle button to header
  const voiceBtn = document.createElement('button')
  voiceBtn.id = 'mia-voice-btn'
  voiceBtn.title = 'Toggle Mia voice'
  voiceBtn.style.cssText = 'background:none;border:1px solid rgba(245,166,35,0.3);border-radius:8px;color:#F5A623;cursor:pointer;font-size:0.75rem;padding:0.25rem 0.5rem;margin-right:0.25rem;font-family:inherit'
  voiceBtn.textContent = '🔇 Voice'
  voiceBtn.addEventListener('click', () => {
    voiceEnabled = !voiceEnabled
    voiceBtn.textContent = voiceEnabled ? '🔊 Voice' : '🔇 Voice'
    voiceBtn.style.background = voiceEnabled ? 'rgba(245,166,35,0.15)' : 'none'
    if (!voiceEnabled) window.speechSynthesis.cancel()
  })
  document.getElementById('mia-close').before(voiceBtn)

  function speakText(text) {
    if (!voiceEnabled || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const clean = text.replace(/<[^>]+>/g, '').replace(/[🧡🔴🟠🟡🟢✅🚗📍]/g, '')
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.rate = 0.95
    utterance.pitch = 1.05
    utterance.volume = 1
    // Try to find a warm female voice
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Moira') || v.name.includes('Female'))
    if (preferred) utterance.voice = preferred
    window.speechSynthesis.speak(utterance)
  }

  function addMessage(role, text) {
    const div = document.createElement('div')
    div.className = `mia-msg ${role}`
    div.innerHTML = text
    messages.appendChild(div)
    messages.scrollTop = messages.scrollHeight
    if (role === 'mia') speakText(text)
    return div
  }

  function showTyping() {
    const div = document.createElement('div')
    div.className = 'mia-msg mia mia-typing'
    div.innerHTML = '<span></span><span></span><span></span>'
    div.id = 'mia-typing'
    messages.appendChild(div)
    messages.scrollTop = messages.scrollHeight
  }

  function removeTyping() {
    document.getElementById('mia-typing')?.remove()
  }

  async function handleSend() {
    const q = input.value.trim()
    if (!q) return
    input.value = ''
    addMessage('user', q)
    logQuestion(q)

    // Check KB first for instant answers
    const kbMatch = findKBMatch(q)
    if (kbMatch) {
      setTimeout(() => {
        const answer = kbMatch.link
          ? `${kbMatch.answer} <a href="${kbMatch.link}">→ Go there</a>`
          : kbMatch.answer
        addMessage('mia', answer)
      }, 600)
      return
    }

    showTyping()

    // Smart rule-based responses
    const lower = q.toLowerCase()
    let response = null

    if (lower.includes('sign up') || lower.includes('create account') || lower.includes('register')) {
      response = "Signing up is free and takes about a minute! Head to our <a href='signup.html'>signup page</a> — choose your role (Free-Roam Donor, Community Partner, or Volunteer), fill in your info, and you're in. 🧡"
    } else if (lower.includes('log in') || lower.includes('login')) {
      response = "You can log in from the <a href='login.html'>login page</a>. If you forgot your password, there's a 'Forgot password?' link right on that page — we'll email you a reset link."
    } else if (lower.includes('deliver') || lower.includes('submission') || lower.includes('log a delivery')) {
      response = "To log a delivery, go to the <a href='deliver.html'>Deliver page</a>. Select where you went, what you brought, and how many people you served. Hit submit and the live feed updates immediately so others can see help just arrived. 🚗"
    } else if (lower.includes('map') || lower.includes('hotspot') || lower.includes('location')) {
      response = "Our <a href='map.html'>map page</a> shows 10 high-need zones across Oakland. Each pin shows what's most needed and an AI insight about peak times. Click any pin to see details and get directions."
    } else if (lower.includes('color') || lower.includes('red') || lower.includes('green') || lower.includes('urgency')) {
      response = "The color system shows how urgently each location needs help:<br/>🔴 <strong>Red</strong> = high need, hasn't been served recently<br/>🟠 <strong>Orange</strong> = moderate need<br/>🟡 <strong>Yellow</strong> = some need<br/>🟢 <strong>Green</strong> = recently served<br/><br/>The live feed on the delivery page updates in real time as donors submit."
    } else if (lower.includes('guest') || lower.includes('without account') || lower.includes('browse')) {
      response = "You can browse the map as a guest without creating an account — just visit our <a href='guest.html'>guest map view</a>. To log deliveries and track your impact, you'll need a free account. <a href='signup.html'>Sign up here →</a>"
    } else if (lower.includes('subscription') || lower.includes('$7') || lower.includes('supporter') || lower.includes('paid')) {
      response = "The Supporter plan is $7/month. It unlocks access to individual support profiles — a private directory of people donors have met in the field. It's designed for donors who want to show up for the same people consistently. You can subscribe from the <a href='profiles-directory.html'>People We Serve page</a>."
    } else if (lower.includes('profile') || lower.includes('individual') || lower.includes('people we serve')) {
      response = "Individual support profiles are private, consent-based pages for people donors have met in the field. They use first name or alias only — dignity always comes first. Profiles are only accessible to Supporters ($7/mo). <a href='profiles-directory.html'>View the directory →</a>"
    } else if (lower.includes('privacy') || lower.includes('data') || lower.includes('consent')) {
      response = "We take privacy very seriously — especially for the people we serve. We never use full legal names, never share data, and profiles require consent. Read our full <a href='privacy.html'>privacy policy →</a>"
    } else if (lower.includes('what is') || lower.includes('about') || lower.includes('mission')) {
      response = "Charity Driver connects free-roam donors with unhoused individuals across Oakland. We exist because people WANT to help — not because they have to. It's rooted in compassion, service, and the belief that ordinary people can do extraordinary things. <a href='about.html'>Read our story →</a>"
    } else if (lower.includes('partner') || lower.includes('nonprofit') || lower.includes('organization') || lower.includes('government')) {
      response = "We'd love to connect! Whether you're a nonprofit, city agency, or funder — Charity Driver is built for collaboration. Reach out through our <a href='contact.html'>contact page</a> and we'll get back to you within 24 hours."
    } else if (lower.includes('how') && lower.includes('help')) {
      response = "There are a few ways to help:<br/>1. <a href='signup.html'>Sign up</a> as a free-roam donor<br/>2. Check the <a href='map.html'>map</a> to see where help is needed<br/>3. Head out and <a href='deliver.html'>log a delivery</a><br/>4. Become a <a href='profiles-directory.html'>Supporter ($7/mo)</a> for deeper engagement<br/><br/>Every bit counts. 🧡"
    } else if (lower.includes('contact') || lower.includes('support') || lower.includes('help')) {
      response = "You can reach us through our <a href='contact.html'>contact page</a>. We respond within 24 hours. For partnership inquiries, org connections, or press — that's the right place."
    } else if (lower.includes('dashboard')) {
      response = "Your <a href='dashboard.html'>dashboard</a> shows your delivery history, impact stats, and the AI-recommended zone for your next delivery based on time of day."
    } else if (lower.includes('pitch') || lower.includes('investor') || lower.includes('invest') || lower.includes('fund')) {
      response = "Interested in partnering with or investing in Charity Driver? Check out our full investor pitch deck — it covers the problem, solution, market opportunity, and our ask. <a href='pitch-deck.html'>View the Pitch Deck 🎥</a> or reach out directly on our <a href='contact.html'>contact page</a>."
    } else if (lower.includes('admin')) {
      response = "The admin dashboard is for verified Charity Driver staff only. If you're an admin, go to <a href='admin.html'>parisirving.com/admin.html</a> and log in with your admin email. Access is controlled by account permissions."
    } else if (lower.includes('tiktok') || lower.includes('social') || lower.includes('follow')) {
      response = "Follow Charity Driver's founder Paris Irving on TikTok and Instagram for behind-the-scenes content, field visits, and updates on the platform. Search @parisislive. 🧡"
    } else if (lower.includes('script') || lower.includes('video') || lower.includes('youtube')) {
      response = "Paris Irving documents the Charity Driver journey on TikTok and YouTube. Follow along to see the real story of building a community platform from Oakland. 🎥"
    } else {
      response = "That's a great question. I want to make sure I give you the right answer — for anything I'm not sure about, our <a href='contact.html'>contact page</a> is the best next step. Is there something specific about Charity Driver I can help clarify? 🧡"
    }

    setTimeout(() => {
      removeTyping()
      addMessage('mia', response)
    }, 900)
  }
}
