# Riding Page

> "This project is forked from [https://github.com/yihong0618/running_page/tree/master] under MIT license."

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

```shell
python run_page/gen_svg.py --from-db --title "Sawyer" --type github --athlete "$Sawyer" --special-distance 10 --special-distance2 20 --special-color yellow --special-color2 red --output assets/github.svg --use-localtime --min-distance 0.5
```