# VFX_SPRITE_DIRECTION_v4a_authoring.md
# AUTHORING AMENDMENT (owner ruling): deliberate motion is
# authored by the SCRIPTED COMPOSITOR - CC animates painted MJ
# layers per Claude's motion briefs, deterministically, in-repo.
# No manual animation tool required. Kling remains the second
# brush for organic single-body churn. The runtime is unchanged.

## THE AUTHORING CHAIN
A1. LAYERED ELEMENTS: MJ/GPT-image paints each effect as separate
    ELEMENT IMAGES on pure black (e.g. fire sweep = base flame
    band + 2-3 tongue overlays + ember field + glow wash). Same
    audit laws as all masters (mode-check, black ground, color
    vetoes, no text, no objects).
A2. MOTION BRIEF (Claude, per effect): layer list, per-layer
    choreography in numbers - drift px/s, noise-displacement
    amplitude/scale/speed, opacity envelopes, flicker rates, loop
    length, easing character - plus veto criteria for the audit.
A3. SCRIPTED COMPOSITOR (CC): scripts/animate_vfx.py - loads the
    element layers, applies the briefed transforms per frame
    (translate/scale/rotate, sine drift, 2D noise-field
    displacement for organic churn, opacity curves, additive glow
    passes via blur-and-add), renders a PNG sequence. Loops by
    construction (all periodic terms share the loop period).
    Deterministic: same brief, same frames, forever. Tuning = one
    number changed, one re-run.
A4. EXPORT SPEC: PNG sequence, 24 fps, black ground; row plates
    at T74's resolution law (1920-wide), loop length per brief;
    contained per W2 (row plates may run to left/right edges;
    top/bottom fade inside frame).
A5. build_vfx_sheets.py 'seq' mode ingests the sequence: clamp +
    mask per standing law, pack sheet, compute MV maps (optical
    flow works identically on authored frames). Existing GPU
    flipbook playback, MV interpolation and all. Zero runtime
    changes.

## SECOND BRUSH
Kling I2V remains permitted where organic whole-body churn suits
prompt-and-curate authoring (per the proven v3 results). Route per
effect is chosen in each motion brief.

## DIVISION OF LABOUR
Owner: MJ layer generation + verdicts (unchanged from the art
program). Claude: motion briefs + frame audits of rendered
sequences (same pixel discipline as every intake). CC: the
compositor script, the seq pipeline mode, and T73 wiring per v4.
