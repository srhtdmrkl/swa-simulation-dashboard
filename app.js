document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const elements = {
        policyActive: document.getElementById('policy-active'),
        pieceRate: document.getElementById('piece-rate'),
        pieceRateVal: document.getElementById('piece-rate-val'),
        supervisorKpi: document.getElementById('supervisor-kpi'),
        supervisorKpiVal: document.getElementById('supervisor-kpi-val'),
        peerPressure: document.getElementById('peer-pressure'),
        peerPressureVal: document.getElementById('peer-pressure-val'),
        discountFactor: document.getElementById('discount-factor'),
        discountFactorVal: document.getElementById('discount-factor-val'),
        falseAlarmPenalty: document.getElementById('false-alarm-penalty'),
        falseAlarmPenaltyVal: document.getElementById('false-alarm-penalty-val'),
        pAccident: document.getElementById('p-accident'),
        pAccidentVal: document.getElementById('p-accident-val'),
        socialCapital: document.getElementById('social-capital'),
        socialCapitalVal: document.getElementById('social-capital-val'),
        lossAversion: document.getElementById('loss-aversion'),
        lossAversionVal: document.getElementById('loss-aversion-val'),
        envState: document.getElementById('environment-state'),

        runBtn: document.getElementById('run-simulation'),
        clearLogBtn: document.getElementById('clear-log'),

        statusText: document.getElementById('status-text'),
        statusPulse: document.getElementById('status-pulse'),

        qContinue: document.getElementById('q-continue'),
        qContinueBreakdown: document.getElementById('q-continue-breakdown'),
        qStop: document.getElementById('q-stop'),
        qStopBreakdown: document.getElementById('q-stop-breakdown'),

        probBarContinue: document.getElementById('prob-bar-continue'),
        probBarStop: document.getElementById('prob-bar-stop'),

        workerAction: document.getElementById('worker-action'),
        logList: document.getElementById('simulation-log')
    };

    // State Mapping
    const stateConfig = {
        'S0': { label: 'S0: Normal Operations', p: 0.01, class: 'normal' },
        'S1': { label: 'S1: Ambiguous Anomaly', p: 0.50, class: 'warning' },
        'S2': { label: 'S2: Imminent Danger', p: 0.95, class: 'danger' }
    };

    // Update Input Displays
    function updateDisplays() {
        elements.pieceRateVal.textContent = elements.pieceRate.value;
        elements.supervisorKpiVal.textContent = elements.supervisorKpi.value;
        elements.peerPressureVal.textContent = elements.peerPressure.value;
        elements.discountFactorVal.textContent = elements.discountFactor.value;
        elements.falseAlarmPenaltyVal.textContent = elements.falseAlarmPenalty.value;
        elements.pAccidentVal.textContent = elements.pAccident.value;
        elements.socialCapitalVal.textContent = elements.socialCapital.value;
        elements.lossAversionVal.textContent = elements.lossAversion.value;
    }

    [
        elements.pieceRate, elements.supervisorKpi, elements.peerPressure,
        elements.discountFactor, elements.falseAlarmPenalty, elements.pAccident,
        elements.socialCapital, elements.lossAversion
    ].forEach(input => {
        input.addEventListener('input', updateDisplays);
        input.addEventListener('change', runSimulation);
    });

    // Update Status Indicator when State changes
    elements.envState.addEventListener('change', () => {
        runSimulation();
        const state = elements.envState.value;
        const conf = stateConfig[state];
        elements.statusText.textContent = `State: ${conf.label}`;
        elements.statusPulse.className = `pulse ${conf.class}`;
    });

    // Logging Utility
    function addLogEntry(message, type = 'system') {
        const li = document.createElement('li');
        li.className = `log-entry ${type}`;

        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

        li.innerHTML = `<span class="timestamp">[${timeString}]</span> ${message}`;
        elements.logList.insertBefore(li, elements.logList.firstChild);

        // Keep log size manageable
        if (elements.logList.children.length > 50) {
            elements.logList.removeChild(elements.logList.lastChild);
        }
    }

    elements.clearLogBtn.addEventListener('click', () => {
        elements.logList.innerHTML = '';
        addLogEntry('Event log cleared.', 'system');
    });

    // MAIN SIMULATION ENGINE
    // Calculates Behavioral Expected Values and outputs a Stochastic Decision

    function runSimulation() {
        // 1. Collect Environmental & Psychological Variables from the UI
        const policyActive = elements.policyActive.checked;
        const pieceRate = parseInt(elements.pieceRate.value, 10);
        const supervisorKpi = parseInt(elements.supervisorKpi.value, 10);
        const peerPressure = parseFloat(elements.peerPressure.value);
        const gamma = parseFloat(elements.discountFactor.value);
        const faPenaltyFactor = parseInt(elements.falseAlarmPenalty.value, 10);
        const pAccidentBase = parseFloat(elements.pAccident.value);
        const socialCap = parseFloat(elements.socialCapital.value);
        const lossAv = parseFloat(elements.lossAversion.value);

        const currentStateStr = elements.envState.value;
        const conf = stateConfig[currentStateStr];
        const p_hazard = conf.p; // Probability that the anomaly is an actual hazard

        // 2. Behavioral Math: Loss Aversion (Prospect Theory)
        // Humans feel losses mathematically harder than equivalent gains. 
        // This helper multiplies any negative score by the Loss Aversion coefficient (λ).
        const applyLossAversion = (value) => value < 0 ? Math.round(value * lossAv) : value;

        // 3. CALCULATE: The Perceived Value of Working (Q_Continue)
        // Why does the worker keep the line moving?
        const qContProd = pieceRate; // Guaranteed, immediate financial reward
        const qContPeer = Math.round(10 * peerPressure); // Social reward for maintaining speed (Max +10)

        // The objective risk of an accident is P(Hazard) * P(Accident|Hazard)
        const trueRiskProb = p_hazard * pAccidentBase;

        // Behavioral trick: The human brain discounts abstract future risks (gamma 'γ'), 
        // but because it's a negative penalty, we subsequently apply Loss Aversion ('λ').
        const baseRiskPenalty = Math.round(-1000 * trueRiskProb * gamma);
        const qContRisk = applyLossAversion(baseRiskPenalty);

        const qContinueTotal = qContProd + qContPeer + qContRisk;

        // 4. CALCULATE: The Perceived Value of Stopping (Q_Stop)
        // What happens if the worker actually pushes the Stop Work button?
        const qStopAvoid = Math.round(1000 * trueRiskProb * gamma); // The abstract, discounted benefit of avoiding a potential accident

        // The immediate social and administrative punishment for stopping the line, subject to Loss Aversion (drastically lowers the score)
        const baseLineStopPenalty = -20 - Math.round(10 * peerPressure) + supervisorKpi;
        const supervisorReaction = applyLossAversion(baseLineStopPenalty);

        // Calculate the "False Alarm" Risk (Stopping work when there wasn't an actual hazard)
        // Social Capital Dampening: High capital (veteran) mitigates the penalty. Low capital (newbie) takes max penalty.
        const p_falseAlarm = 1 - p_hazard;
        const bufferedFaPenalty = faPenaltyFactor * (1 - socialCap);
        const baseFaRisk = Math.round(p_falseAlarm * -bufferedFaPenalty);
        const qStopFalseAlarm = applyLossAversion(baseFaRisk);

        // Penalty for lacking structural corporate support (No formal policy to protect them)
        const policyPenalty = applyLossAversion(policyActive ? 0 : -50);

        const qStopTotal = qStopAvoid + supervisorReaction + qStopFalseAlarm + policyPenalty;

        // 5. Update UI: Output the final calculated psychological values to the dashboard
        elements.qContinue.textContent = qContinueTotal > 0 ? `+${qContinueTotal}` : qContinueTotal;
        elements.qContinue.className = `value ${qContinueTotal >= 0 ? 'highlight-positive' : 'highlight-negative'}`;

        elements.qStop.textContent = qStopTotal > 0 ? `+${qStopTotal}` : qStopTotal;
        elements.qStop.className = `value ${qStopTotal >= 0 ? 'highlight-positive' : 'highlight-negative'}`;

        elements.qContinueBreakdown.innerHTML = `
            <span>Production: ${qContProd >= 0 ? '+' + qContProd : qContProd}</span>
            <span>Peer Speed: ${qContPeer >= 0 ? '+' + qContPeer : qContPeer}</span>
            <span style="color:var(--negative)">Discounted Risk: ${qContRisk}</span>
        `;

        elements.qStopBreakdown.innerHTML = `
            <span style="color:var(--positive)">Hazard Avoided: +${qStopAvoid}</span>
            <span style="${supervisorReaction >= 0 ? 'color:var(--positive)' : 'color:var(--negative)'}">Super+Peer Penalty: ${supervisorReaction > 0 ? '+' + supervisorReaction : supervisorReaction}</span>
            <span style="color:var(--negative)">False Alarm Risk: ${qStopFalseAlarm}</span>
            ${!policyActive ? `<span style="color:var(--negative)">Policy Missing: -50</span>` : ''}
        `;

        // 6. Stochastic Action Selection (Softmax Function)
        // Rather than forcing a robotic 100% deterministic decision, we calculate the statistical PROBABILITY 
        // of the worker stopping vs continuing, based on the exponential difference between the Q-values.
        // Formula: P(a) = e^{Q(a)/T} / Σe^{Q/T}

        // 'Temperature' (T) controls human randomness. Higher T = more random. Lower T = highly deterministic.
        const temperature = 15;

        // Prevent floating-point math limit overflow by normalizing against the max Q-value
        const maxQ = Math.max(qContinueTotal, qStopTotal);
        const expCont = Math.exp((qContinueTotal - maxQ) / temperature);
        const expStop = Math.exp((qStopTotal - maxQ) / temperature);

        const probContinue = expCont / (expCont + expStop);
        const probStop = expStop / (expCont + expStop);

        const probContinuePct = Math.round(probContinue * 100);
        const probStopPct = Math.round(probStop * 100);

        // Render the exact probabilities to the UI bar

        elements.probBarContinue.style.width = `${probContinuePct}%`;
        elements.probBarContinue.textContent = `${probContinuePct}% CONTINUE`;

        elements.probBarStop.style.width = `${probStopPct}%`;
        elements.probBarStop.textContent = `${probStopPct}% STOP`;

        // 7. Make the Final Decision (Execute a probabilistic roll)
        let actionStr = "";
        let logType = "";

        const elCardCont = document.getElementById('card-continue');
        const elCardStop = document.getElementById('card-stop');

        elCardCont.style.border = "1px solid var(--panel-border)";
        elCardStop.style.border = "1px solid var(--panel-border)";

        // Generate a random number between 0 and 1 against the probability threshold
        const roll = Math.random();

        if (roll < probStop) {
            actionStr = "WORKER PULLED THE CORD";
            logType = "decision-stop";
            elements.workerAction.className = "action-result stop";
            elements.workerAction.innerHTML = `🛑 ${actionStr}`;
            elCardStop.style.border = "1px solid var(--negative)";

            addLogEntry(`Worker STOPPED. (${probStopPct}% statistical probability in ${currentStateStr})`, logType);
        } else {
            actionStr = "WORKER KEPT GOING";
            logType = "decision-continue";
            elements.workerAction.className = "action-result continue";
            elements.workerAction.innerHTML = `⚙️ ${actionStr}`;
            elCardCont.style.border = "1px solid var(--positive)";

            addLogEntry(`Worker CONTINUED. (${probContinuePct}% statistical probability in ${currentStateStr})`, logType);
        }
    }

    // Modal Logic
    const aboutBtn = document.getElementById('about-btn');
    const aboutModal = document.getElementById('about-modal');
    const closeModal = document.getElementById('close-modal');

    aboutBtn.addEventListener('click', () => {
        aboutModal.classList.add('active');
    });

    closeModal.addEventListener('click', () => {
        aboutModal.classList.remove('active');
    });

    // Close on click outside the content box
    aboutModal.addEventListener('click', (e) => {
        if (e.target === aboutModal) {
            aboutModal.classList.remove('active');
        }
    });

    elements.runBtn.addEventListener('click', runSimulation);

    // Initial run to populate defaults on page load
    runSimulation();
});
