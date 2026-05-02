# Liquidsoap Customization Notes

AzuraCast supports custom Liquidsoap snippets per station. The exact insertion points can vary by version, so validate against your installed release before promoting changes.

## Files in this repo

- `config/liquidsoap/eq-base.liq` - simple EQ chain example
- `config/liquidsoap/radio-effects.liq` - compressor / limiter style chain
- `config/stations/azura-one.liq` - station-specific example
- `config/stations/azura-chill.liq` - station-specific example
- `config/stations/azura-talk.liq` - station-specific example

## How to apply

Common paths:

1. Paste station-specific snippets into the station's custom Liquidsoap field in AzuraCast.
2. Keep canonical versions in git here.
3. Reload station configuration and test audio artifacts after each change.

## Safety notes

- Start with subtle EQ moves.
- Avoid aggressive compression unless you are matching a loud broadcast aesthetic.
- Speech stations usually benefit from lighter stereo processing.
- Keep a rollback copy of known-good scripts.
