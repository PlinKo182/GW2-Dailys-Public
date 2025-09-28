export const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text.trim()).catch(() => {
    const textArea = document.createElement('textarea');
    textArea.value = text.trim();
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  });
};