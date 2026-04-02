/** Request body for POST /uown/svc/updateOptOutAi */
export interface UpdateOptOutAiBody {
  phonePK: number;
  optOutAi: boolean;
  optOutAiReason?: string;
}

/** Request body for POST /uown/svc/updateDnc */
export interface UpdateDncBody {
  phonePK: number;
  doNotCall: boolean;
  reasonForDnc?: string;
}

/** Request body for POST /uown/svc/updateDnt */
export interface UpdateDntBody {
  phonePK: number;
  doNotText: boolean;
  reasonForDnt?: string;
}
