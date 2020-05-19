namespace HelloWorld
{
    class Player
    {
        static readonly CONSTANTS =
        {
            FADE_TIME: 0.005,
            SILENCE_DURATION: 0.005,
            GAIN_VALUE: 0.1,

            TEMPO: 120,
            NOTE_DURATIONS: [
                // 4,      // whole
                2,      // half
                1,      // quarter
                0.5,    // eighth
                0.25,   // sixteenth
            ],
            // A Minor scale
            SCALE: [
                220,
                220 * Math.pow(2, 2/12),    // whole
                220 * Math.pow(2, 3/12),    // half
                220 * Math.pow(2, 5/12),    // whole
                220 * Math.pow(2, 7/12),    // whole
                220 * Math.pow(2, 8/12),    // half
                220 * Math.pow(2, 10/12),   // whole
                220 * Math.pow(2, 12/12),   // whole
                0                           // Rest
            ]
        }

        ctx: AudioContext;

        constructor(ctx: AudioContext)
        {
            this.ctx = ctx;
            this.osc_ = null;
            this.gainNode_ = this.ctx.createGain();
            this.gainNode_.gain.value = Player.CONSTANTS.GAIN_VALUE;
            this.gainNode_.connect(this.ctx.destination);

        }

        public play(when?: number, freq?: number)
        {
            when = when ?? this.ctx.currentTime;
            freq = freq ?? Player.CONSTANTS.SCALE[0];

            this.stop();
            this.osc_ = this.ctx.createOscillator();
            this.osc_.type = "square";
            this.osc_.connect(this.gainNode_);

            this.osc_.start(when);
            this.osc_.frequency.value = freq;
            // Fade in
            this.gainNode_.gain.linearRampToValueAtTime(0, when);
            this.gainNode_.gain.linearRampToValueAtTime(Player.CONSTANTS.GAIN_VALUE, when + Player.CONSTANTS.FADE_TIME);
            when += (60 / Player.CONSTANTS.TEMPO) * Player.CONSTANTS.NOTE_DURATIONS[Math.floor(Math.random() * Player.CONSTANTS.NOTE_DURATIONS.length)];
            // Fade out
            this.gainNode_.gain.linearRampToValueAtTime(Player.CONSTANTS.GAIN_VALUE, when - Player.CONSTANTS.FADE_TIME);
            this.gainNode_.gain.linearRampToValueAtTime(0, when);
            this.osc_.stop(when);

            freq = Player.CONSTANTS.SCALE[Math.floor(Math.random() * Player.CONSTANTS.SCALE.length)];
            // Loop
            this.osc_.onended = this.play.bind(this, when + Player.CONSTANTS.SILENCE_DURATION, freq);
        }

        public stop()
        {
            if (this.osc_)
            {
                this.osc_.onended = null;
                this.gainNode_.gain.cancelScheduledValues(0);
                this.osc_.disconnect();
                this.osc_ = null;
            }
        }

        private gainNode_: GainNode;
        private osc_: OscillatorNode | null;
    }

    let player = new Player(new AudioContext());
    document.getElementById("play")?.addEventListener("click", () => {player.ctx.resume().then(() => player.play())})
    document.getElementById("stop")?.addEventListener("click", () => {player.stop()})
}
