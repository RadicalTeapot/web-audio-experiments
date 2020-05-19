// See here (https://teropa.info/blog/2016/07/28/javascript-systems-music.html#brian-enoambient-1-music-for-airports-2-11978)
namespace MusicForAirports
{
    type NOTE = "F2" | "A2b" | "C3" | "D3b" | "E3b" | "F3" | "A3b" | "F4" | "C5" | "E5b";
    interface ICONSTANTS {
        NOTES: {[T in NOTE]: number},
        GAIN_VALUE: number,
        WAVE_TYPE: OscillatorType,
    }

    class Player
    {
        static readonly CONSTANTS: ICONSTANTS =
        {
            NOTES: {
                "F2": 110 * Math.pow(2, -4/12),
                "A2b": 110 * Math.pow(2, -1/12),
                "C3": 220 * Math.pow(2, -9/12),
                "D3b": 220 * Math.pow(2, -8/12),
                "E3b": 220 * Math.pow(2, -6/12),
                "F3": 220 * Math.pow(2, -4/12),
                "A3b": 220 * Math.pow(2, -1/12),

                "F4": 440 * Math.pow(2, -4/12),
                "C5": 440 * Math.pow(2, -9/12),
                "E5b": 440 * Math.pow(2, -6/12),
            },
            GAIN_VALUE: 0.1,
            WAVE_TYPE: "square",
        }

        ctx: AudioContext
        constructor(ctx: AudioContext) {
            this.ctx = ctx;
            this.oscillators_ = {};
            this.oscillatorGains_ = {};
            this.gainNode_ = this.ctx.createGain();
            this.gainNode_.gain.value = 1.0;
            this.gainNode_.connect(this.ctx.destination);
            // See here (https://stackoverflow.com/a/47593316)
            this.lcg_ = (seed: number) =>()=>(2**31-1&(seed=Math.imul(48271,seed)))/2**31;
            this.rand_ = () => 0;
        }

        public play()
        {
            let seed = (document.getElementById("seed") as HTMLInputElement).value;
            if (seed === "")
                seed = Math.floor(Math.random() * Math.pow(2, 32)).toString();
            this.rand_ = this.lcg_(this.xmur3(seed)());
            // Discard the first result
            this.rand_();

            const time = this.ctx.currentTime;
            console.log(`Seed ${seed}`);
            // Bass
            let notes: NOTE[] = ["F2", "A2b", "C3", "D3b", "E3b", "F3", "A3b"];
            let when: number[] = notes.map((note: NOTE) => this.rand_() * 15);
            let loop_durations: number[] = notes.map((note: NOTE) => this.rand_() * 10 + 15);
            let note_durations: number[] = loop_durations.map((duration: number) => duration * (this.rand_() * 0.25 + 0.125));

            notes.forEach((note: NOTE, index: number) => {
                this.playNote(note, when[index] + time, note_durations[index], loop_durations[index]);
            });

            // Lead
            notes = ["F4", "C5", "E5b"];
            when = notes.map((note: NOTE) => this.rand_() * 15);
            loop_durations = notes.map((note: NOTE) => this.rand_() * 3 + 6);
            note_durations = loop_durations.map((duration: number) => duration * (this.rand_() * 0.25 + 0.125));

            notes.forEach((note: NOTE, index: number) => {
                this.playNote(note, when[index] + time, note_durations[index], loop_durations[index]);
            });
        }

        public playNote(note: NOTE, when: number, note_duration: number, loop_duration: number) {
            this.createOscillator(note);
            this.oscillators_[note]!.start(when);
            this.oscillatorGains_[note]!.gain.setValueAtTime(0, when);
            this.oscillatorGains_[note]!.gain.setTargetAtTime(Player.CONSTANTS.GAIN_VALUE, when, note_duration * 0.1);
            this.oscillatorGains_[note]!.gain.setValueAtTime(Player.CONSTANTS.GAIN_VALUE, when + note_duration * 0.33);
            this.oscillatorGains_[note]!.gain.setTargetAtTime(0, when + note_duration * 0.33, note_duration * 0.33);
            when += loop_duration;
            this.oscillators_[note]!.stop(when);
            note_duration = loop_duration * (this.rand_() * 0.25 + 0.125);
            this.oscillators_[note]!.onended = this.playNote.bind(this, note, when, note_duration, loop_duration)
        }

        public stop()
        {
            (Object.keys(Player.CONSTANTS.NOTES) as NOTE[]).forEach((note: NOTE) =>
            {
                this.stopOscillator(note);
            });
        }

        private createOscillator(note: NOTE)
        {
            this.stopOscillator.bind(this, note);
            this.oscillators_[note] = this.ctx.createOscillator();
            this.oscillators_[note]!.type = Player.CONSTANTS.WAVE_TYPE;
            this.oscillators_[note]!.frequency.value = Player.CONSTANTS.NOTES[note];
            this.oscillatorGains_[note] = this.ctx.createGain();
            this.oscillatorGains_[note]!.connect(this.gainNode_);
            this.oscillators_[note]!.connect(this.oscillatorGains_[note]!);
        }

        private stopOscillator(note: NOTE)
        {
            if (this.oscillators_[note] !== undefined)
            {
                this.oscillators_[note]!.onended = null;
                this.oscillators_[note]!.disconnect();
                delete this.oscillators_[note];
            }

            if (this.oscillatorGains_[note] !== undefined)
            {
                this.oscillatorGains_[note]!.disconnect();
                delete this.oscillatorGains_[note];
            }
        }

        // See here (https://stackoverflow.com/a/47593316)
        private xmur3(str: string): () => number
        {
            for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
                h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
                h = h << 13 | h >>> 19;
            return function() {
                h = Math.imul(h ^ h >>> 16, 2246822507);
                h = Math.imul(h ^ h >>> 13, 3266489909);
                return (h ^= h >>> 16) >>> 0;
            }
        }

        private gainNode_: GainNode;
        private oscillators_: Partial<{[T in NOTE] : OscillatorNode}>;
        private oscillatorGains_: Partial<{[T in NOTE] : GainNode}>;
        private lcg_: (seed: number) => () => number;
        private rand_: () => number;
    }

    let player = new Player(new AudioContext());
    document.getElementById("play")?.addEventListener("click", () => {player.ctx.resume().then(() => {player.stop(); player.play();})})
    document.getElementById("stop")?.addEventListener("click", () => {player.stop()})
}
