export const formatPublicationDate = (pub: Publication): string => {
  const date = new Date(pub.publishDate);
  
  const month = date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
  const day = date.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' });
  
  return `${month}, ${day} (${pub.issueName})`;
};
