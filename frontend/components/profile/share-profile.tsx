'use client'

import { useEffect, useMemo, useState } from 'react'
import QRCode from 'react-qr-code'
import { MonoLabel, StampButton } from '@/components/folio/primitives'
import { profileApi } from '@/lib/profile/api'
