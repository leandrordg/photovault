import {
  MultipleImageUpload,
  SingleImageUpload,
} from "@/components/image-uploader";

export default function HomePage() {
  return (
    <div>
      <SingleImageUpload />
      <hr />
      <MultipleImageUpload />
    </div>
  );
}
