// Builds and submits a hidden form that POSTs the order to PayFast — the same
// mechanism the checkout page uses to hand off to the gateway.
export const submitToPayfast = (gateway) => {
  if (!gateway?.process_url) return;

  const form = document.createElement("form");
  form.method = "POST";
  form.action = gateway.process_url;

  Object.entries(gateway.form_fields || {}).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
};
