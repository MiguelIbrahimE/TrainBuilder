import { Router } from 'express';
import { netherlandsData } from '../data/netherlands.geojson';
import { belgiumData } from '../data/belgium.geojson';

const router = Router();

// Combined benelux data
const beneluxData = {
  country: {
    type: "FeatureCollection",
    features: [
      netherlandsData.country,
      belgiumData.country
    ]
  },
  cities: [
    ...netherlandsData.cities,
    ...belgiumData.cities
  ],
  water: [
    ...(netherlandsData.water || []),
    ...(belgiumData.water || [])
  ]
};

// Get geodata for a specific region
router.get('/:regionId', (req, res) => {
  const { regionId } = req.params;

  let data;
  switch (regionId) {
    case 'netherlands':
      data = netherlandsData;
      break;
    case 'belgium':
      data = belgiumData;
      break;
    case 'benelux':
      data = beneluxData;
      break;
    default:
      return res.status(404).json({ error: 'Region not found' });
  }

  res.json(data);
});

// Get just cities for a region (lighter payload)
router.get('/:regionId/cities', (req, res) => {
  const { regionId } = req.params;

  let cities;
  switch (regionId) {
    case 'netherlands':
      cities = netherlandsData.cities;
      break;
    case 'belgium':
      cities = belgiumData.cities;
      break;
    case 'benelux':
      cities = beneluxData.cities;
      break;
    default:
      return res.status(404).json({ error: 'Region not found' });
  }

  res.json({ cities });
});

export default router;
