python run_page/gpx_sync.py &&

python run_page/gen_svg.py --from-db --title "Sawyer" --type github --athlete "$Sawyer" --special-distance 10 --special-distance2 20 --special-color yellow --special-color2 red --output assets/github.svg --use-localtime --min-distance 0.5

python run_page/gen_svg.py --from-db --title "Over 10KM Rides" --type grid --athlete "Sawyer"  --output assets/grid.svg --min-distance 10.0 --special-color yellow --special-color2 red --special-distance 20 --special-distance2 40 --use-localtime