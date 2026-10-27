// Who runs the platform and how to reach them. Contact details are the ones published on the
// sister site starindia.fsia.in (Boss, 2026-10-27). Change them here only.
export const ORGANISER = {
  name: "FSIA Influencer",
  email: "starindiaaward@gmail.com",
  phoneDisplay: "+91 99832 86999",
  phoneHref: "tel:+919983286999",
  whatsappHref: "https://wa.me/919983286999",
  locality: "Jaipur",
  region: "Rajasthan",
  country: "IN",
  location: "Jaipur, Rajasthan, India"
} as const;

/** Applications are open right now (Boss, 2026-10-27). Set to false to hide the "open" labels. */
export const APPLICATIONS_OPEN = true;

/** Shown wherever money or applications come up: the most common award scam is a fake agent asking for a fee. */
export const ANTI_FRAUD_NOTE = `Applying for the award is free. If anyone asks you to pay to apply or to be selected, check with us first at ${ORGANISER.email} or ${ORGANISER.phoneDisplay}.`;
