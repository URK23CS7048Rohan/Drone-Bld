// Blood compatibility matrix & scoring
export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const
export type BloodType = (typeof BLOOD_TYPES)[number]

// canDonateTo[donor] = list of recipients
export const CAN_DONATE_TO: Record<string, string[]> = {
    'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+'],
}

// canReceiveFrom[recipient] = list of donors
export const CAN_RECEIVE_FROM: Record<string, string[]> = {
    'O-': ['O-'],
    'O+': ['O-', 'O+'],
    'A-': ['O-', 'A-'],
    'A+': ['O-', 'O+', 'A-', 'A+'],
    'B-': ['O-', 'B-'],
    'B+': ['O-', 'O+', 'B-', 'B+'],
    'AB-': ['O-', 'A-', 'B-', 'AB-'],
    'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
}

export function getCompatibilityScore(donor: string, recipient: string): number {
    if (donor === recipient) return 100
    if (CAN_DONATE_TO[donor]?.includes(recipient)) {
        // Penalize non-exact matches
        const rhMatch =
            (donor.endsWith('+') && recipient.endsWith('+')) ||
            (donor.endsWith('-') && recipient.endsWith('-'))
        return rhMatch ? 90 : 75
    }
    return 0
}

export function getRankedDonors(recipientType: string) {
    return BLOOD_TYPES.map((t) => ({
        type: t,
        score: getCompatibilityScore(t, recipientType),
        compatible: CAN_RECEIVE_FROM[recipientType]?.includes(t) ?? false,
    })).sort((a, b) => b.score - a.score)
}
