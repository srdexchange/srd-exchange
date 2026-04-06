'use client';

import RangoWidgetClient from './RangoWidgetClient';

export default function RangoSwapWidget() {
  return (
    <div className="flex justify-center w-full">
      <div className="w-full max-w-[480px]">
        <RangoWidgetClient />
      </div>
    </div>
  );
}
