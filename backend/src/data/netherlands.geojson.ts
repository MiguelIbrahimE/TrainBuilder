/**
 * Netherlands GeoJSON Data
 * Simplified country boundary and major cities
 * This is much more efficient than thousands of PNG tiles
 */

export const netherlandsData = {
  country: {
    type: "Feature",
    properties: {
      name: "Netherlands",
      id: "netherlands"
    },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [3.36, 51.37], // Southwest corner
        [3.36, 53.55], // Northwest corner
        [7.23, 53.55], // Northeast corner
        [7.23, 51.37], // Southeast corner
        [3.36, 51.37]  // Close polygon
      ]]
    }
  },
  water: [
    // IJsselmeer (large lake)
    {
      type: "Feature",
      properties: { name: "IJsselmeer", type: "lake" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [5.15, 52.55], [5.25, 52.90], [5.50, 52.95],
          [5.65, 52.70], [5.45, 52.50], [5.15, 52.55]
        ]]
      }
    },
    // Markermeer
    {
      type: "Feature",
      properties: { name: "Markermeer", type: "lake" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [5.10, 52.45], [5.25, 52.55], [5.35, 52.45],
          [5.20, 52.35], [5.10, 52.45]
        ]]
      }
    },
    // Rhine River
    {
      type: "Feature",
      properties: { name: "Rhine", type: "river" },
      geometry: {
        type: "LineString",
        coordinates: [
          [5.90, 51.85], [5.85, 51.90], [5.70, 51.95],
          [5.50, 52.00], [5.30, 52.05], [5.10, 52.10],
          [4.90, 52.15], [4.70, 52.18], [4.50, 52.20]
        ]
      }
    }
  ],
  cities: [
    {
      type: "Feature",
      properties: {
        name: "Amsterdam",
        population: 872680,
        type: "capital",
        stationType: "hub"
      },
      geometry: {
        type: "Point",
        coordinates: [4.9041, 52.3676]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Rotterdam",
        population: 651446,
        type: "major",
        stationType: "hub"
      },
      geometry: {
        type: "Point",
        coordinates: [4.4777, 51.9244]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "The Hague",
        population: 545163,
        type: "major",
        stationType: "intercity"
      },
      geometry: {
        type: "Point",
        coordinates: [4.3007, 52.0705]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Utrecht",
        population: 361699,
        type: "major",
        stationType: "intercity"
      },
      geometry: {
        type: "Point",
        coordinates: [5.1214, 52.0907]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Eindhoven",
        population: 234456,
        type: "city",
        stationType: "intercity"
      },
      geometry: {
        type: "Point",
        coordinates: [5.4697, 51.4416]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Groningen",
        population: 233218,
        type: "city",
        stationType: "regional"
      },
      geometry: {
        type: "Point",
        coordinates: [6.5665, 53.2194]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Tilburg",
        population: 222601,
        type: "city",
        stationType: "regional"
      },
      geometry: {
        type: "Point",
        coordinates: [5.0913, 51.5555]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Almere",
        population: 214715,
        type: "city",
        stationType: "regional"
      },
      geometry: {
        type: "Point",
        coordinates: [5.2647, 52.3708]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Breda",
        population: 184126,
        type: "city",
        stationType: "regional"
      },
      geometry: {
        type: "Point",
        coordinates: [4.7762, 51.5719]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Nijmegen",
        population: 177818,
        type: "city",
        stationType: "regional"
      },
      geometry: {
        type: "Point",
        coordinates: [5.8520, 51.8126]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Haarlem",
        population: 162543,
        type: "city",
        stationType: "regional"
      },
      geometry: {
        type: "Point",
        coordinates: [4.6462, 52.3874]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Arnhem",
        population: 161368,
        type: "city",
        stationType: "regional"
      },
      geometry: {
        type: "Point",
        coordinates: [5.8987, 51.9851]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Enschede",
        population: 159632,
        type: "city",
        stationType: "regional"
      },
      geometry: {
        type: "Point",
        coordinates: [6.8937, 52.2215]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Apeldoorn",
        population: 165525,
        type: "city",
        stationType: "regional"
      },
      geometry: {
        type: "Point",
        coordinates: [5.9699, 52.2112]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Zwolle",
        population: 130592,
        type: "city",
        stationType: "local"
      },
      geometry: {
        type: "Point",
        coordinates: [6.0944, 52.5168]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Leiden",
        population: 125174,
        type: "city",
        stationType: "local"
      },
      geometry: {
        type: "Point",
        coordinates: [4.4792, 52.1601]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Maastricht",
        population: 121558,
        type: "city",
        stationType: "local"
      },
      geometry: {
        type: "Point",
        coordinates: [5.6913, 50.8514]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Dordrecht",
        population: 119260,
        type: "city",
        stationType: "local"
      },
      geometry: {
        type: "Point",
        coordinates: [4.6900, 51.8133]
      }
    }
  ]
};
