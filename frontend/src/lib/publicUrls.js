export function getPublicApiOrigin() {
  return window.location.origin;
}

export function getPublicWebhookUrl(sourceSystemId) {
  return `${getPublicApiOrigin()}/api/webhooks/${sourceSystemId}/shipments`;
}
