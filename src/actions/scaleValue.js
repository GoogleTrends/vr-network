/*
  file: scaleValue.js
  description: Scales value from given domain to given range
  company: Pitch Interactive
  author: James Proctor
  license: MIT
*/

export function toRange(value, domain, range) {
  return (((value - domain.min) / (domain.max - domain.min)) * (range.max - range.min)) + range.min;
}

export function toRangeWithGap(value, domain, range, gap) {
  let scaledValue = value;
  const halfDomain = domain.min + ((domain.max - domain.min) / 2);
  const halfRange = range.min + ((range.max - range.min) / 2);
  if (value < halfDomain) {
    scaledValue = toRange(
      value,
      {
        min: domain.min,
        max: halfDomain,
      },
      {
        min: range.min,
        max: halfRange - (gap / 2),
      },
    );
  } else {
    scaledValue = toRange(
      value,
      {
        min: halfDomain,
        max: domain.max,
      },
      {
        min: halfRange + (gap / 2),
        max: range.max,
      },
    );
  }
  return scaledValue;
}
