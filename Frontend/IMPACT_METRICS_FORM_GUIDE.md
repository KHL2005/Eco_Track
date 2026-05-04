# Feature: Impact Metrics Form Component

## Overview
The `ImpactMetricsForm.jsx` is a new structured component for managing environmental impact metrics in the EcoTrack project management system.

## Purpose
Provides a reusable, well-organized form for creating and editing impact metrics across projects without limiting to predefined fields.

## Features

### Predefined Impact Metrics
- Trees Planted (🌳)
- Area Restored in hectares (🌾)
- CO₂ Reduced in tons (💨)
- Renewable Energy in kWh (⚡)
- Waste Collected in kg (♻️)
- Water Bodies Cleaned (💧)
- Pollution Incidents Resolved (⚠️)
- People Benefited (👥)
- Awareness Sessions Conducted (📢)
- Volunteer Engagements (🤝)

### Additional Features
- **Notes Section**: Free-text observations and achievements
- **Custom Metrics**: Add any project-specific metrics dynamically
- **Validation**: All numeric inputs are parsed as floats
- **Icons**: Visual indicators for each metric type
- **Responsive Grid**: 2-column layout on larger screens

## Props

```javascript
ImpactMetricsForm.propTypes = {
  initialMetrics: PropTypes.object,  // Pre-filled metrics data
  onSave: PropTypes.func.isRequired, // Save callback receives metrics object
  loading: PropTypes.bool,           // Show loading state on button
  isEdit: PropTypes.bool,            // Display "Update" or "Create" label
};
```

## Usage Example

```javascript
import ImpactMetricsForm from './ImpactMetricsForm';

export default function MyComponent() {
  const [modal, setModal] = useState(false);

  const handleSave = (metricsData) => {
    // metricsData contains all metrics including custom ones
    console.log(metricsData);
    // Send to API
  };

  return (
    <>
      <button onClick={() => setModal(true)}>Create Impact</button>
      
      <Modal open={modal} onClose={() => setModal(false)}>
        <ImpactMetricsForm
          initialMetrics={{}}
          onSave={handleSave}
          loading={false}
          isEdit={false}
        />
      </Modal>
    </>
  );
}
```

## Output Format

When form is submitted, `onSave` receives an object like:

```javascript
{
  treesPlanted: 500,
  areaRestoredHectares: 25.5,
  co2ReducedTons: 120,
  renewableEnergyKwh: 5000,
  wasteCollectedKg: 3000,
  waterBodiesCleaned: 3,
  pollutionIncidentsResolved: 12,
  peopleBenefited: 10000,
  awarenessSessionsConducted: 8,
  volunteerEngagements: 150,
  notes: "Local AQI improved from 180 to 95",
  customMetrics: {
    aqiBefore: 180,
    aqiAfter: 95,
    treesPlantedNearFactory: 50
  }
}
```

## Validation

- Empty metrics show error toast
- At least one metric required
- Custom metric requires both key and value
- All numeric fields auto-converted to float

## Styling

Uses Tailwind CSS with custom design system:
- Primary colors: forest-600, green-600
- Backgrounds: earth-50, earth-100
- Borders: bark-400/20
- Icons: Emoji-based (🌳, 💨, etc.)

## Integration with ImpactManagement

The `ImpactManagement.jsx` component uses this form in:
- Create impact modal (new impact)
- Edit impact modal (update existing impact)

```javascript
<Modal open={modal} onClose={() => setModal(false)}>
  <ImpactMetricsForm
    initialMetrics={metrics}  // From impact response
    onSave={(data) => createMut.mutate(data)}
    loading={createMut.isPending}
    isEdit={true}
  />
</Modal>
```

## Custom Metric Management

Users can dynamically add custom metrics:
1. Enter metric name (camelCase recommended)
2. Enter numeric value
3. Click Add button
4. Metric displays in list below
5. Click trash icon to remove before submitting

## API Integration

The form data is wrapped before sending to API:

```javascript
// Form output
data = { treesPlanted: 500, ... }

// Wrapped for API
projectsApi.addOrUpdateImpact(projectId, { metrics: data })

// Backend receives
ImpactRequest {
  metrics: ImpactMetrics { ... },
  status: "DRAFT"
}
```

## Tips & Best Practices

1. **Reuse Form**: Use same component for create and edit
2. **Partial Updates**: Empty fields are not sent (validation ensures at least one)
3. **Custom Metrics**: Naming should be descriptive (e.g., `aqiBefore`, `treesPlanted`)
4. **Notes**: Provide context for non-standard metrics in notes field
5. **Edit Mode**: Always pass `isEdit={true}` when updating to show correct label

## Troubleshooting

**Form shows "Please enter at least one metric"**
- Ensure at least one predefined field or custom metric is filled
- Check that numeric values are valid numbers

**Custom metrics not appearing**
- Verify key name doesn't contain spaces
- Check value is a valid number
- Click Add button after entering key and value

**Form submission fails**
- Check API endpoint returns proper ImpactResponse
- Verify backend validation against ImpactMetrics schema
- Check network tab for response errors

