/**
 * Belgium GeoJSON Data
 * Simplified country boundary and major cities
 */

export const belgiumData = {
  country: {
    type: "Feature",
    properties: {
      name: "Belgium",
      id: "belgium"
    },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [2.5, 49.5],  // Southwest
        [2.5, 51.5],  // Northwest
        [6.4, 51.5],  // Northeast
        [6.4, 49.5],  // Southeast
        [2.5, 49.5]   // Close
      ]]
    }
  },
  water: [
    // Meuse River
    {
      type: "Feature",
      properties: { name: "Meuse", type: "river" },
      geometry: {
        type: "LineString",
        coordinates: [
          [5.60, 49.55], [5.50, 49.80], [5.40, 50.00],
          [5.30, 50.20], [5.20, 50.40], [5.10, 50.60],
          [4.90, 50.80], [4.70, 51.00], [4.50, 51.20]
        ]
      }
    }
  ],
  cities: [
    {
      type: "Feature",
      properties: {
        name: "Brussels",
        population: 1208542,
        type: "capital",
        stationType: "hub"
      },
      geometry: {
        type: "Point",
        coordinates: [4.3517, 50.8503]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Antwerp",
        population: 523248,
        type: "major",
        stationType: "hub"
      },
      geometry: {
        type: "Point",
        coordinates: [4.4025, 51.2194]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Ghent",
        population: 262219,
        type: "major",
        stationType: "intercity"
      },
      geometry: {
        type: "Point",
        coordinates: [3.7174, 51.0543]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Charleroi",
        population: 201816,
        type: "city",
        stationType: "intercity"
      },
      geometry: {
        type: "Point",
        coordinates: [4.4444, 50.4108]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Liège",
        population: 197355,
        type: "city",
        stationType: "intercity"
      },
      geometry: {
        type: "Point",
        coordinates: [5.5797, 50.6292]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Bruges",
        population: 118284,
        type: "city",
        stationType: "regional"
      },
      geometry: {
        type: "Point",
        coordinates: [3.2247, 51.2093]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Namur",
        population: 110939,
        type: "city",
        stationType: "regional"
      },
      geometry: {
        type: "Point",
        coordinates: [4.8719, 50.4674]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Leuven",
        population: 102275,
        type: "city",
        stationType: "regional"
      },
      geometry: {
        type: "Point",
        coordinates: [4.7005, 50.8798]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Mons",
        population: 95299,
        type: "city",
        stationType: "local"
      },
      geometry: {
        type: "Point",
        coordinates: [3.9522, 50.4542]
      }
    }
  ]
};
