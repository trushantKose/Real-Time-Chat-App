
import { useRef } from "react";

import {
  Send,
  ImagePlus,
  LoaderCircle,
} from "lucide-react";

function MessageInput({
  message,
  setMessage,
  onSend,
  onImageSelect,
  uploading,
  hasImage,
}) {
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if ((!message.trim() && !hasImage) || uploading) return;

    await onSend();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      onImageSelect(file);
    }

    // Allow selecting the same image again
    e.target.value = "";
  };

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      {/* IMAGE ATTACHMENT BUTTON */}
      <input
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/webp,image/gif"
        ref={fileInputRef}
        onChange={handleFileChange}
        hidden
      />

      <button
        type="button"
        className="attachment-button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        title="Attach image"
      >
        <ImagePlus size={21} />
      </button>

      {/* TEXT INPUT */}
      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={uploading}
      />

      {/* SEND BUTTON */}
      <button
        type="submit"
        disabled={
          uploading || (!message.trim() && !hasImage)
        }
        title="Send message"
      >
        {uploading ? (
          <LoaderCircle size={20} className="spin" />
        ) : (
          <Send size={20} />
        )}
      </button>
    </form>
  );
}

export default MessageInput;
