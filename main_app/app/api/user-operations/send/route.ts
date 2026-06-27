import { NextRequest, NextResponse } from "next/server";

import { submitSponsoredUserOp } from "@/lib/server/sendUserOp";
import { UserOperation } from "@/lib/userOperation";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      chainId?: number;
      userOperation?: UserOperation;
    };

    if (!body.userOperation) {
      return NextResponse.json(
        { success: false, error: "Missing signed userOperation payload." },
        { status: 400 }
      );
    }

    const submission = await submitSponsoredUserOp(body.userOperation);

    return NextResponse.json({
      success: true,
      userOpHash: submission.userOpHash,
      transactionHash: submission.transactionHash,
    });
  } catch (error) {
    console.error("Failed to send user operation:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send user operation",
      },
      { status: 500 }
    );
  }
}
