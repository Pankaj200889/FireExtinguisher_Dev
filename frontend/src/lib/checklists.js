export const CHECKLISTS = {
    'Fire Extinguisher': {
        title: 'Fire Extinguisher Inspection',
        steps: [
            {
                id: 'pressure_gauge',
                label: 'Pressure Gauge',
                type: 'dropdown',
                options: ['Green Zone', 'Not in Green Zone', 'N/A']
            },
            {
                id: 'safety_seal',
                label: 'Safety Pin & Seal',
                type: 'dropdown',
                options: ['Intact', 'Tampered or Missing', 'N/A']
            },
            {
                id: 'hose_nozzle',
                label: 'Nozzle & Discharge Hose',
                type: 'dropdown',
                options: ['Clear & Flexible', 'Blocked or Cracked', 'N/A']
            },
            {
                id: 'physical_condition',
                label: 'Physical Condition',
                type: 'dropdown',
                options: ['No Damage', 'Visible Rust or Dents', 'N/A']
            },
            {
                id: 'accessibility',
                label: 'Accessibility & Visibility',
                type: 'dropdown',
                options: ['Clear', 'Obstructed', 'N/A']
            },
            {
                id: 'instructions',
                label: 'Operating Instructions',
                type: 'dropdown',
                options: ['Legible', 'Faded or Damaged', 'N/A']
            },
            {
                id: 'signage',
                label: 'Signage',
                type: 'dropdown',
                options: ['Legible', 'Faded or Damaged', 'N/A']
            }
        ]
    },
    'Fire Hose Reel': {
        title: 'Fire Hose Reel Inspection',
        steps: [
            {
                id: 'cabinet_condition',
                label: 'Cabinet Condition',
                type: 'dropdown',
                options: ['Clean & Intact', 'Damaged or Dirty', 'N/A']
            },
            {
                id: 'glass_panel',
                label: 'Glass / Front Panel',
                type: 'dropdown',
                options: ['Intact', 'Broken or Missing', 'N/A']
            },
            {
                id: 'drum_rotation',
                label: 'Drum Rotation',
                type: 'dropdown',
                options: ['Smooth', 'Jammed or Stiff', 'N/A']
            },
            {
                id: 'hose_condition',
                label: 'Hose Condition',
                type: 'dropdown',
                options: ['Properly Wound', 'Damaged or Leaking', 'N/A']
            },
            {
                id: 'spray_nozzle',
                label: 'Spray Nozzle',
                type: 'dropdown',
                options: ['Connected & Functional', 'Missing or Leaking', 'N/A']
            },
            {
                id: 'operating_valve',
                label: 'Operating Valve',
                type: 'dropdown',
                options: ['Operational', 'Jammed', 'N/A']
            },
            {
                id: 'accessibility',
                label: 'Accessibility',
                type: 'dropdown',
                options: ['Unobstructed', 'Blocked', 'N/A']
            }
        ]
    },
    'Hydrant Hose Reel': {
        title: 'Hydrant Hose Reel Inspection',
        steps: [
            {
                id: 'hose_box_seal',
                label: 'Hose Box Seal',
                type: 'dropdown',
                options: ['Intact', 'Broken', 'N/A']
            },
            {
                id: 'cabinet_door_glass',
                label: 'Cabinet Door & Glass',
                type: 'dropdown',
                options: ['Properly Closing', 'Damaged', 'N/A']
            },
            {
                id: 'hose_condition',
                label: 'Hose Condition',
                type: 'dropdown',
                options: ['Rolled Correctly', 'Fungus or Stiffness Detected', 'N/A']
            },
            {
                id: 'nozzle_condition',
                label: 'Nozzle (Single/Multi)',
                type: 'dropdown',
                options: ['Attached & Operational', 'Missing', 'N/A']
            },
            {
                id: 'hydrant_valve',
                label: 'Hydrant Valve',
                type: 'dropdown',
                options: ['No Leaks', 'Visible Corrosion or Leakage', 'N/A']
            },
            {
                id: 'signages',
                label: 'Signages',
                type: 'dropdown',
                options: ['Clear & Visible', 'Missing or Faded', 'N/A']
            }
        ]
    },
    'Fire Sand Bucket': {
        title: 'Fire Sand Bucket Inspection',
        steps: [
            {
                id: 'sand_level',
                label: 'Sand Level',
                type: 'dropdown',
                options: ['Filled to Capacity', 'Partial or Empty', 'N/A']
            },
            {
                id: 'sand_quality',
                label: 'Sand Quality',
                type: 'dropdown',
                options: ['Dry & Loose', 'Wet or Lumpy', 'Debris Found', 'N/A']
            },
            {
                id: 'bucket_condition',
                label: 'Bucket Condition',
                type: 'dropdown',
                options: ['Good Paint/No Rust', 'Dented or Corroded', 'Missing Bottom', 'N/A']
            },
            {
                id: 'shovel_handle',
                label: 'Shovel/Handle',
                type: 'dropdown',
                options: ['Present & Secure', 'Missing or Damaged', 'Loose Handle', 'N/A']
            },
            {
                id: 'stand_condition',
                label: 'Condition of Stand',
                type: 'dropdown',
                options: ['Stable & Painted', 'Unstable or Rusted', 'Damaged', 'N/A']
            },
            {
                id: 'visibility',
                label: 'Visibility',
                type: 'dropdown',
                options: ['Clear', 'Obstructed by Debris', 'Not Visible', 'N/A']
            }
        ]
    },
    'Fire Water Bucket': {
        title: 'Fire Water Bucket Inspection',
        steps: [
            {
                id: 'water_level',
                label: 'Water Level',
                type: 'dropdown',
                options: ['Filled to Capacity', 'Partial or Empty', 'N/A']
            },
            {
                id: 'water_quality',
                label: 'Water Quality',
                type: 'dropdown',
                options: ['Clean', 'Stagnant/Dirty', 'Mosquito Larvae', 'N/A']
            },
            {
                id: 'bucket_condition',
                label: 'Bucket Condition',
                type: 'dropdown',
                options: ['Good Paint/No Rust', 'Dented or Corroded', 'Leaking', 'N/A']
            },
            {
                id: 'handle',
                label: 'Handle/Mug',
                type: 'dropdown',
                options: ['Present & Secure', 'Missing or Damaged', 'N/A']
            },
            {
                id: 'stand_condition',
                label: 'Condition of Stand',
                type: 'dropdown',
                options: ['Stable & Painted', 'Unstable or Rusted', 'Damaged', 'N/A']
            },
            {
                id: 'visibility',
                label: 'Visibility',
                type: 'dropdown',
                options: ['Clear', 'Obstructed by Debris', 'Not Visible', 'N/A']
            }
        ]
    }
};
