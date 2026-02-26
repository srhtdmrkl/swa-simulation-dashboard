# SWA Behavioral Dynamics Simulator
An interactive, Reinforcement Learning (RL) and Behavioral Economics dashboard designed to model the Stop Work Authority (SWA) decision-making in industrial environments.

## Overview
This application models why workers frequently choose *not* to use their Stop Work Authority, even when explicitly told they are allowed to. Rather than treating human workers as strictly rational actors calculating objective risk, the simulation engine calculates the **Perceived Value of Working** vs. **The Perceived Value of Stopping**.

The mathematical engine driving the dashboard utilizes models established by Kahneman & Tversky (Prospect Theory), Hyperbolic Discounting, and Stochastic Softmax action selection.

## Behavioral Mechanics
The underlying JavaScript engine (`app.js`) features several academic concepts:

1. **Decoupled Probabilities**: Factoring the probability of a hazard separately from the probability of a fatal accident.
2. **Temporal Risk Discounting ($\gamma$)**: Modeling how the human brain discounts abstract, future injury risk compared to immediate financial incentives like piece-rate bonuses.
3. **Loss Aversion ($\lambda$)**: Utilizing Prospect Theory, negative penalties (such as Supervisory wrath or False Alarms) are mathematically weighted drastically heavier than equivalent positive gains.
4. **Social Capital Buffer**: An algorithmic dampener giving veteran workers structural immunity to the social penalty of a False Alarm, while making the same penalty devastating for new hires.
5. **Softmax Action Selection**: Workers exhibit a stochastic probability distribution of behavior based on temperature-scaled differences in Q-values, modeling the sheer unpredictability of human action.