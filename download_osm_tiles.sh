#!/bin/bash
# Download OSM tiles for TrainBuilder game
# Usage: ./download_osm_tiles.sh [country_codes...]
# Example: ./download_osm_tiles.sh NL BE LU

set -e

echo "========================================="
echo "TrainBuilder OSM Tile Downloader"
echo "========================================="
echo ""

# Create data directory
mkdir -p data

# Function to convert lat/lon to tile coordinates
lat_lon_to_tile() {
    local lat=$1
    local lon=$2
    local zoom=$3

    local n=$(echo "scale=10; e($zoom * l(2))" | bc -l)

    # X coordinate
    local x=$(echo "scale=10; ($lon + 180) / 360 * $n" | bc)
    x=$(printf "%.0f" "$x")

    # Y coordinate (Mercator projection)
    local lat_rad=$(echo "scale=10; $lat * 3.14159265359 / 180" | bc -l)
    local y=$(echo "scale=10; (1 - l((s($lat_rad) + 1) / c($lat_rad)) / 3.14159265359) / 2 * $n" | bc -l)
    y=$(printf "%.0f" "$y")

    echo "$x $y"
}

# Function to download tiles for a country
download_country() {
    local country_name="$1"
    local country_code="$2"
    local min_lat=$3
    local max_lat=$4
    local min_lon=$5
    local max_lon=$6
    local min_zoom=$7
    local max_zoom=$8

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📍 $country_name ($country_code)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "   Bounds: Lat ${min_lat}°-${max_lat}°, Lon ${min_lon}°-${max_lon}°"
    echo "   Zoom levels: $min_zoom-$max_zoom"
    echo ""

    mkdir -p "data/$country_code"

    local total_downloaded=0
    local total_skipped=0

    for zoom in $(seq $min_zoom $max_zoom); do
        echo "🔍 Zoom level $zoom..."

        # Calculate tile bounds
        local n=$((2 ** zoom))

        # Calculate tile coordinates
        read min_x min_y <<< $(lat_lon_to_tile $max_lat $min_lon $zoom)
        read max_x max_y <<< $(lat_lon_to_tile $min_lat $max_lon $zoom)

        # Clamp to valid range
        min_x=$(( min_x < 0 ? 0 : min_x ))
        max_x=$(( max_x >= n ? n-1 : max_x ))
        min_y=$(( min_y < 0 ? 0 : min_y ))
        max_y=$(( max_y >= n ? n-1 : max_y ))

        local tiles_x=$((max_x - min_x + 1))
        local tiles_y=$((max_y - min_y + 1))
        local total_tiles=$((tiles_x * tiles_y))

        echo "   Tile range: X[$min_x-$max_x] Y[$min_y-$max_y]"
        echo "   Total tiles: $total_tiles"

        local downloaded=0
        local skipped=0

        for y in $(seq $min_y $max_y); do
            for x in $(seq $min_x $max_x); do
                local tile_file="data/${country_code}/${zoom}_${x}_${y}.png"

                if [ -f "$tile_file" ]; then
                    skipped=$((skipped + 1))
                else
                    local url="https://tile.openstreetmap.org/${zoom}/${x}/${y}.png"

                    # Download with retry
                    local retry_count=0
                    local max_retries=3
                    local success=false

                    while [ $retry_count -lt $max_retries ] && [ "$success" = false ]; do
                        if curl -s -f -A "TrainBuilder/1.0 (Educational)" -m 10 "$url" -o "$tile_file" 2>/dev/null; then
                            downloaded=$((downloaded + 1))
                            success=true
                        else
                            retry_count=$((retry_count + 1))
                            if [ $retry_count -lt $max_retries ]; then
                                sleep 0.5
                            fi
                        fi
                    done

                    if [ "$success" = false ]; then
                        echo "   ⚠️  Failed to download tile $zoom/$x/$y after $max_retries attempts"
                    fi

                    # Rate limiting: OSM tile usage policy requires ~1 request per 0.1s
                    sleep 0.1
                fi

                # Progress indicator every 10 tiles
                local current=$((downloaded + skipped))
                if [ $((current % 10)) -eq 0 ]; then
                    local percent=$((current * 100 / total_tiles))
                    echo -ne "   Progress: $current/$total_tiles ($percent%) [Downloaded: $downloaded, Cached: $skipped]\r"
                fi
            done
        done

        echo -ne "\n"
        echo "   ✅ Zoom $zoom complete: $downloaded new, $skipped cached"

        total_downloaded=$((total_downloaded + downloaded))
        total_skipped=$((total_skipped + skipped))
    done

    echo ""
    echo "✨ $country_name complete!"
    echo "   Total downloaded: $total_downloaded tiles"
    echo "   Total cached: $total_skipped tiles"
    echo ""
}

# BENELUX Countries
download_benelux() {
    echo "🇪🇺 BENELUX Region"
    echo ""

    download_country "Netherlands" "NL" 50.75 53.7 3.31 7.23 7 10
    download_country "Belgium" "BE" 49.5 51.5 2.5 6.4 7 10
    download_country "Luxembourg" "LU" 49.4 50.2 5.7 6.5 7 10
}

# More European countries (add as needed)
download_dach() {
    echo "🇪🇺 DACH Region (Germany, Austria, Switzerland)"
    echo ""

    download_country "Germany" "DE" 47.3 55.1 5.9 15.0 6 9
    download_country "Austria" "AT" 46.4 49.0 9.5 17.2 7 10
    download_country "Switzerland" "CH" 45.8 47.8 5.9 10.5 7 10
}

download_nordic() {
    echo "🇪🇺 Nordic Region"
    echo ""

    download_country "Denmark" "DK" 54.5 57.8 8.0 15.2 6 9
    download_country "Sweden" "SE" 55.3 69.1 11.0 24.2 5 8
    download_country "Norway" "NO" 57.9 71.2 4.5 31.2 5 8
    download_country "Finland" "FI" 59.8 70.1 20.5 31.6 5 8
}

download_uk_ireland() {
    echo "🇪🇺 UK & Ireland"
    echo ""

    download_country "United Kingdom" "UK" 49.9 60.9 -8.0 2.0 6 9
    download_country "Ireland" "IE" 51.4 55.4 -10.5 -5.5 7 10
}

download_france_iberia() {
    echo "🇪🇺 France & Iberia"
    echo ""

    download_country "France" "FR" 41.3 51.1 -5.2 9.6 6 9
    download_country "Spain" "ES" 36.0 43.8 -9.3 3.3 6 9
    download_country "Portugal" "PT" 36.9 42.2 -9.5 -6.2 7 10
}

download_central_europe() {
    echo "🇪🇺 Central Europe"
    echo ""

    download_country "Poland" "PL" 49.0 54.9 14.1 24.2 6 9
    download_country "Czech Republic" "CZ" 48.5 51.1 12.1 18.9 7 10
    download_country "Slovakia" "SK" 47.7 49.6 16.8 22.6 7 10
    download_country "Hungary" "HU" 45.7 48.6 16.1 22.9 7 10
}

download_italy() {
    echo "🇪🇺 Italy"
    echo ""

    download_country "Italy" "IT" 36.6 47.1 6.6 18.5 6 9
}

# Main menu
show_menu() {
    echo "Select regions to download:"
    echo ""
    echo "  1) BENELUX (Netherlands, Belgium, Luxembourg) - RECOMMENDED"
    echo "  2) DACH (Germany, Austria, Switzerland)"
    echo "  3) Nordic (Denmark, Sweden, Norway, Finland)"
    echo "  4) UK & Ireland"
    echo "  5) France & Iberia (Spain, Portugal)"
    echo "  6) Central Europe (Poland, Czech, Slovakia, Hungary)"
    echo "  7) Italy"
    echo "  8) All of the above (will take hours!)"
    echo "  9) Custom (specify country codes)"
    echo ""
    echo "  0) Exit"
    echo ""
}

# Parse command line arguments
if [ $# -gt 0 ]; then
    if [ "$1" = "benelux" ]; then
        download_benelux
    elif [ "$1" = "dach" ]; then
        download_dach
    elif [ "$1" = "nordic" ]; then
        download_nordic
    elif [ "$1" = "uk" ]; then
        download_uk_ireland
    elif [ "$1" = "france" ]; then
        download_france_iberia
    elif [ "$1" = "central" ]; then
        download_central_europe
    elif [ "$1" = "italy" ]; then
        download_italy
    elif [ "$1" = "all" ]; then
        download_benelux
        download_dach
        download_nordic
        download_uk_ireland
        download_france_iberia
        download_central_europe
        download_italy
    else
        echo "Usage: $0 [benelux|dach|nordic|uk|france|central|italy|all]"
        exit 1
    fi
else
    # Interactive mode
    show_menu
    read -p "Enter choice [1-9,0]: " choice

    case $choice in
        1) download_benelux ;;
        2) download_dach ;;
        3) download_nordic ;;
        4) download_uk_ireland ;;
        5) download_france_iberia ;;
        6) download_central_europe ;;
        7) download_italy ;;
        8)
            echo "⚠️  WARNING: This will download thousands of tiles and may take several hours!"
            read -p "Are you sure? (yes/no): " confirm
            if [ "$confirm" = "yes" ]; then
                download_benelux
                download_dach
                download_nordic
                download_uk_ireland
                download_france_iberia
                download_central_europe
                download_italy
            fi
            ;;
        9)
            echo "Not implemented yet - edit the script to add custom countries"
            ;;
        0) exit 0 ;;
        *) echo "Invalid choice"; exit 1 ;;
    esac
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Download Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Storage usage:"
du -sh data/ 2>/dev/null || echo "data/ directory: 0 bytes"
echo ""
echo "📁 Tiles saved to: $(pwd)/data/"
echo ""
echo "🎮 Ready to use with TrainBuilder!"
echo ""
