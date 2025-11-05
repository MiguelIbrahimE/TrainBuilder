#!/bin/bash
# Download OSM tiles for all countries during Docker build

set -e

echo "Downloading OSM tiles for all countries..."

# Create data directory
mkdir -p data

# Function to download tiles for a country
download_country_tiles() {
    local country_code=$1
    local min_lat=$2
    local max_lat=$3
    local min_lon=$4
    local max_lon=$5
    local min_zoom=$6
    local max_zoom=$7

    echo "Downloading tiles for $country_code..."
    mkdir -p "data/$country_code"

    for zoom in $(seq $min_zoom $max_zoom); do
        # Calculate tile bounds
        n=$(echo "2^$zoom" | bc)

        # Convert lat/lon to tile coords (simplified)
        min_x=$(echo "($min_lon + 180) / 360 * $n" | bc)
        max_x=$(echo "($max_lon + 180) / 360 * $n" | bc)

        # Simple mercator for y (approximate)
        min_y=$(echo "scale=10; (1 - ($max_lat * 0.01745329252)) / 2 * $n" | bc)
        max_y=$(echo "scale=10; (1 - ($min_lat * 0.01745329252)) / 2 * $n" | bc)

        # Round to integers
        min_x=$(printf "%.0f" $min_x)
        max_x=$(printf "%.0f" $max_x)
        min_y=$(printf "%.0f" $min_y)
        max_y=$(printf "%.0f" $max_y)

        echo "  Zoom $zoom: tiles ${min_x}-${max_x}, ${min_y}-${max_y}"

        tile_count=0
        for y in $(seq $min_y $max_y); do
            for x in $(seq $min_x $max_x); do
                tile_file="data/${country_code}/${zoom}_${x}_${y}.png"

                if [ ! -f "$tile_file" ]; then
                    url="https://tile.openstreetmap.org/${zoom}/${x}/${y}.png"
                    curl -s -f -A "TrainBuilder/1.0" "$url" -o "$tile_file" 2>/dev/null || true
                    tile_count=$((tile_count + 1))

                    # Rate limit: OSM requests max 1 tile per 0.1s
                    sleep 0.1

                    # Progress indicator
                    if [ $((tile_count % 10)) -eq 0 ]; then
                        echo "    Downloaded $tile_count tiles..."
                    fi
                fi
            done
        done

        echo "  Zoom $zoom complete ($tile_count new tiles)"
    done

    echo "Finished $country_code"
}

# Download for Netherlands (example - small country)
download_country_tiles "NL" 50.75 53.7 3.31 7.23 7 9

# Download for Belgium (small)
download_country_tiles "BE" 49.5 51.5 2.5 6.4 7 9

# You can add more countries here, but keep it reasonable
# Each zoom level = 4x more tiles
# Recommendation: Only download zoom 7-9 for small countries

echo "All tiles downloaded!"
echo "Total size:"
du -sh data/
