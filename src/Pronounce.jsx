import { useEffect, useState } from "react";
import { useApp } from "./AppContext";

// The two accents, labelled the way a dictionary labels them. "UK" and "US" stay untranslated
// on purpose: they are the same two letters whichever language the interface is in.
const ACCENTS = [
  { id: "UK", lang: "en-GB" },
  { id: "US", lang: "en-US" },
];

function synth() {
  return typeof window === "undefined" ? null : window.speechSynthesis;
}

/** Whether this browser speaks at all — older ones and some in-app browsers do not. */
export function canSpeak() {
  return Boolean(synth() && window.SpeechSynthesisUtterance);
}

const tag = (voice) => voice.lang.replace("_", "-").toLowerCase();

/**
 * The English voices installed here. A machine can have a speech engine and still have nothing
 * English in it — Windows ships the voices of the system language and no others — and reading
 * an English word with a Russian voice is not a pronunciation, so the list is what decides
 * whether the buttons work at all.
 */
function englishVoices() {
  return canSpeak() ? synth().getVoices().filter((voice) => tag(voice).startsWith("en")) : [];
}

// Chrome loads its voice list in the background and only starts loading once asked, so the
// first ask happens here, at import time, rather than inside the learner's first click.
englishVoices();

/**
 * The English voices, kept live: Chrome answers the first `getVoices()` with an empty list and
 * reports the real one later, by which time the buttons have already been rendered.
 */
function useEnglishVoices() {
  const [voices, setVoices] = useState(englishVoices);
  useEffect(() => {
    const engine = synth();
    if (!engine?.addEventListener) {
      return undefined;
    }
    const refresh = () => setVoices(englishVoices());
    engine.addEventListener("voiceschanged", refresh);
    return () => engine.removeEventListener("voiceschanged", refresh);
  }, []);
  return voices;
}

export function stopSpeaking() {
  synth()?.cancel();
}

/**
 * Say one word in one voice. Anything still being said is cut off first: two clicks in a row
 * mean "again", not "twice".
 */
function speak(text, lang, voice, done) {
  const engine = synth();
  engine.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.voice = voice;
  // A single word at full speed is over before it is heard; this is slow enough to catch the
  // vowel in, which is the half of the word the two accents disagree about.
  utterance.rate = 0.9;
  utterance.onend = done;
  utterance.onerror = done;
  engine.speak(utterance);
}

/**
 * Hear a word in British or American English. The browser's own engine says it, so there is no
 * audio to ship and no dictionary to look the word up in — a word the learner typed in
 * themselves is spoken on the same terms as a shared one.
 */
export default function Pronounce({ text }) {
  const { t } = useApp();
  const voices = useEnglishVoices();
  const [speaking, setSpeaking] = useState("");

  // A round moves on while a word is still being said. That voice belongs to the word that has
  // just left the screen, so it leaves with it.
  useEffect(() => stopSpeaking, [text]);

  if (!text || !canSpeak()) {
    return null;
  }
  return (
    <span className="speak">
      {ACCENTS.map((accent) => {
        // The accent asked for, or the only English there is: one voice for both buttons is a
        // blunter answer than two, and still the right word said in English.
        const voice = voices.find((each) => tag(each) === accent.lang.toLowerCase()) || voices[0];
        const label = voice ? t(`english.speak.${accent.id}`) : t("english.speak.none");
        return (
          <button
            key={accent.id}
            type="button"
            className={speaking === accent.id ? "btn speak-btn on" : "btn speak-btn"}
            disabled={!voice}
            title={label}
            aria-label={label}
            // The quiz reads Space and Enter as "on to the next one", so a speaker button left
            // holding the focus would answer those keys itself. The click never takes it.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setSpeaking(accent.id);
              speak(text, accent.lang, voice, () => setSpeaking(""));
            }}
          >
            <span aria-hidden="true">🔊</span> {accent.id}
          </button>
        );
      })}
    </span>
  );
}
