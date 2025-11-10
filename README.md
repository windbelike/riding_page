# Cycling Page

> "This project is forked from [https://github.com/yihong0618/running_page/tree/master] under MIT license."

## 🗺️ Map Update
**Now using Leaflet instead of Mapbox!** Beautiful, free, open-source maps with better visuals.
See [LEAFLET_MIGRATION.md](./LEAFLET_MIGRATION.md) for details.

## install and develop

```shell
pip3 install -r requirements.txt
npm install -g corepack && corepack enable && pnpm install
pnpm develop
```

## Prepare your data

Copy your gpx data to GPX_OUT, then run:

```shell
python run_page/gpx_sync.py
```

### Total page


github.svg

```shell
python run_page/gen_svg.py --from-db --title "Sawyer" --type github --athlete "$Sawyer" --special-distance 10 --special-distance2 20 --special-color yellow --special-color2 red --output assets/github.svg --use-localtime --min-distance 0.5
```

grid.svg
```shell
python run_page/gen_svg.py --from-db --title "Over 10KM Rides" --type grid --athlete "Sawyer"  --output assets/grid.svg --min-distance 10.0 --special-color yellow --special-color2 red --special-distance 20 --special-distance2 40 --use-localtime
```